import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/admin/Sidebar";
import {
  Package,
  Plus,
  Edit,
  AlertTriangle,
  TrendingUp,
  Boxes,
  ShoppingCart,
  BarChart3
} from "lucide-react";

interface InventoryItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  sku?: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: string | number;
  supplier?: string;
  isActive: boolean;
  lastRestocked?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function Inventory() {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const { toast } = useToast();

  // Add Item Form
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItemForm,
    setValue: setItemValue,
    watch: watchItem,
    formState: { errors: itemErrors }
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      currentStock: "0",
      minimumStock: "10",
      sku: "",
      unitPrice: "0.00",
      supplier: ""
    }
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["/api/inventory/items"],
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/inventory/categories"],
    retry: false,
  });

  const addItemMutation = useMutation({
    mutationFn: async (newItem: any) => {
      // Generate ID and format data properly
      const formattedItem = {
        ...newItem,
        id: `item_${Date.now()}`,
        unitPrice: parseFloat(newItem.unitPrice),
        currentStock: parseInt(newItem.currentStock) || 0,
        minimumStock: parseInt(newItem.minimumStock) || 10,
        isActive: true,
        // Ensure SKU is provided or generate one
        sku: newItem.sku || `SKU_${Date.now()}`
      };

      console.log('Submitting item:', formattedItem);
      const response = await apiRequest('POST', '/api/inventory/items', formattedItem);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Item added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      setIsAddingItem(false);
      resetItemForm();
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Add item error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive"
      });
    }
  });

  const restockMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('PUT', `/api/inventory/items/${itemId}`, {
        currentStock: 50 // Default restock amount
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      toast({
        title: "Success",
        description: "Item restocked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restock item",
        variant: "destructive"
      });
    }
  });

  const onAddItemSubmit = (data: any) => {
    console.log('Form data:', data);

    // Validate required fields before submission
    if (!data.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }

    if (!data.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive"
      });
      return;
    }

    addItemMutation.mutate(data);
  };

  const handleRestock = (itemId: string) => {
    restockMutation.mutate(itemId);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const inventoryItems: InventoryItem[] = Array.isArray(inventory) ? inventory : [];

  const getItemStatus = (item: InventoryItem) => {
    if (item.currentStock <= Math.floor(item.minimumStock * 0.3)) return 'critical';
    if (item.currentStock <= item.minimumStock) return 'low-stock';
    return 'in-stock';
  };

  const inventoryStats = [
    {
      title: "Total Items",
      value: inventoryItems.length,
      icon: Package,
      color: "text-blue-500"
    },
    {
      title: "Low Stock",
      value: inventoryItems.filter(item => getItemStatus(item) === 'low-stock').length,
      icon: AlertTriangle,
      color: "text-yellow-500"
    },
    {
      title: "Critical Stock",
      value: inventoryItems.filter(item => getItemStatus(item) === 'critical').length,
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "Total Value",
      value: `R${inventoryItems.reduce((acc: number, item: InventoryItem) =>
        acc + (item.currentStock * parseFloat(String(item.unitPrice))), 0
      ).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-500"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-500/20 text-green-500';
      case 'low-stock': return 'bg-yellow-500/20 text-yellow-500';
      case 'critical': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getCategoryName = (categoryId: string): string => {
    // First check if we have category data from API
    const category = categories.find((cat: Category) => cat.id === categoryId);
    if (category) return category.name;

    // Fallback to hardcoded mapping
    const categoryMap: Record<string, string> = {
      'cat1': 'Cleaning Supplies',
      'cat2': 'Accessories',
      'cat3': 'Detailing',
      'cat4': 'Equipment'
    };
    return categoryMap[categoryId] || categoryId;
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `R${numPrice.toFixed(2)}`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage your supplies and equipment</p>
            </div>
            <Button
              onClick={() => setIsAddingItem(true)}
              className="glass-button"
              data-testid="button-add-item"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inventoryStats.map((stat, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Alert Section */}
          {inventoryItems.filter(item => getItemStatus(item) !== 'in-stock').length > 0 && (
            <GlassCard className="p-6 border-orange-500/50">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-orange-500">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Stock Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryItems
                  .filter(item => getItemStatus(item) !== 'in-stock')
                  .map((item) => (
                    <div key={item.id} className="p-4 glass-effect rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <Badge className={getStatusColor(getItemStatus(item))}>
                          {getItemStatus(item)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{getCategoryName(item.categoryId)}</p>
                      <div className="flex justify-between text-sm">
                        <span>Current: {item.currentStock} units</span>
                        <span>Min: {item.minimumStock} units</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 glass-button"
                        data-testid={`restock-${item.id}`}
                        onClick={() => handleRestock(item.id)}
                        disabled={restockMutation.isPending}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {restockMutation.isPending ? 'Restocking...' : 'Restock'}
                      </Button>
                    </div>
                  ))}
              </div>
            </GlassCard>
          )}

          {/* Inventory List */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Boxes className="w-5 h-5 mr-2 text-primary" />
              Inventory Items ({inventoryItems.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Total Value</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => {
                    const itemStatus = getItemStatus(item);
                    const StockIcon = itemStatus === 'critical' || itemStatus === 'low-stock' ? AlertTriangle : Package;
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <StockIcon className={`w-5 h-5 ${
                              itemStatus === 'critical' ? 'text-red-500' :
                              itemStatus === 'low-stock' ? 'text-yellow-500' : 'text-primary'
                            }`} />
                            <div>
                              <p className="font-medium text-foreground" data-testid={`item-name-${item.id}`}>
                                {item.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.supplier && `Supplier: ${item.supplier}`}
                                {item.sku && ` • SKU: ${item.sku}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{getCategoryName(item.categoryId)}</td>
                        <td className="p-3">
                          <div>
                            <span className="font-medium text-foreground" data-testid={`item-stock-${item.id}`}>
                              {item.currentStock} units
                            </span>
                            <p className="text-sm text-muted-foreground">
                              Min: {item.minimumStock}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="p-3 font-medium text-green-500" data-testid={`item-value-${item.id}`}>
                          {formatPrice(item.currentStock * parseFloat(String(item.unitPrice)))}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(itemStatus)}>
                            {itemStatus.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" className="glass-effect">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-effect"
                              onClick={() => handleRestock(item.id)}
                              disabled={restockMutation.isPending}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {inventoryItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No inventory items found. Click "Add Item" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="glass-effect max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gradient">Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitItem(onAddItemSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  {...registerItem("name", { required: "Item name is required" })}
                  placeholder="e.g., Car Shampoo"
                  className="glass-input"
                  data-testid="input-item-name"
                />
                {itemErrors.name && (
                  <p className="text-red-500 text-sm">{itemErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...registerItem("sku")}
                  placeholder="e.g., CHEM-001"
                  className="glass-input"
                  data-testid="input-item-sku"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  onValueChange={(value) => {
                    setItemValue("categoryId", value);
                  }}
                >
                  <SelectTrigger className="glass-input" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="cat1">Cleaning Supplies</SelectItem>
                        <SelectItem value="cat2">Accessories</SelectItem>
                        <SelectItem value="cat3">Detailing</SelectItem>
                        <SelectItem value="cat4">Equipment</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {itemErrors.categoryId && (
                  <p className="text-red-500 text-sm">{itemErrors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  {...registerItem("supplier")}
                  placeholder="e.g., ChemClean SA"
                  className="glass-input"
                  data-testid="input-supplier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  {...registerItem("currentStock", {
                    required: "Current stock is required",
                    min: { value: 0, message: "Stock cannot be negative" }
                  })}
                  placeholder="0"
                  className="glass-input"
                  data-testid="input-current-stock"
                />
                {itemErrors.currentStock && (
                  <p className="text-red-500 text-sm">{itemErrors.currentStock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock *</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  {...registerItem("minimumStock", {
                    required: "Minimum stock is required",
                    min: { value: 0, message: "Stock cannot be negative" }
                  })}
                  placeholder="10"
                  className="glass-input"
                  data-testid="input-minimum-stock"
                />
                {itemErrors.minimumStock && (
                  <p className="text-red-500 text-sm">{itemErrors.minimumStock.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="unitPrice">Unit Price (ZAR) *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  {...registerItem("unitPrice", {
                    required: "Unit price is required",
                    min: { value: 0, message: "Price cannot be negative" }
                  })}
                  placeholder="0.00"
                  className="glass-input"
                  data-testid="input-unit-price"
                />
                {itemErrors.unitPrice && (
                  <p className="text-red-500 text-sm">{itemErrors.unitPrice.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...registerItem("description")}
                placeholder="Enter item description..."
                className="glass-input resize-none"
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingItem(false);
                  resetItemForm();
                }}
                className="glass-effect"
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addItemMutation.isPending}
                className="glass-button"
                data-testid="button-submit-add"
              >
                {addItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}