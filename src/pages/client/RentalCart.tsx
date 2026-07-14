import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { InventoryItem } from '../../types';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineTrash
} from 'react-icons/hi2';

export const RentalCart: React.FC = () => {
  const { user } = useAuth();
  const { clients, inventory, submitRentalRequest, logActivity } = useData();
  const navigate = useNavigate();

  const clientProfile = clients.find(c => c.email === user?.email || c.name === user?.name) || clients[0];

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<Array<{ item: InventoryItem; quantity: number }>>([]);
  
  // Date params
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const categories = [
    'Excavators', 'Concrete Mixers', 'Scaffolding', 'Compactors', 
    'Drilling Machines', 'Cutting Machines', 'Generators', 
    'Road Rollers', 'Water Pumps', 'Power Tools', 'Construction Machinery', 
    'Safety Equipment', 'Electrical Tools', 'Hand Tools'
  ];

  // Calculate Duration
  const calculateDays = () => {
    const start = new Date(startDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const durationDays = calculateDays();

  // Filter available inventory
  const availableItems = inventory.filter(i => {
    const isAvailable = i.status === 'Available';
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return isAvailable && matchesCategory && matchesSearch;
  });

  const addToCart = (item: InventoryItem) => {
    const exists = cart.find(c => c.item.id === item.id);
    if (exists) {
      toast.info(`${item.name} is already in your cart`);
      return;
    }
    setCart(prev => [...prev, { item, quantity: 1 }]);
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
    toast.info('Item removed from cart');
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, c) => sum + (c.item.rentalPriceDay * c.quantity * durationDays), 0);
  const securityDepositTotal = cart.reduce((sum, c) => sum + (c.item.securityDeposit * c.quantity), 0);
  const estimatedTax = Math.round(subtotal * 0.18);
  const estimatedGrandTotal = subtotal + estimatedTax + securityDepositTotal;

  const handleSubmitCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Your rental cart is empty');
      return;
    }

    if (new Date(startDate) > new Date(returnDate)) {
      toast.error('Start date cannot exceed return date');
      return;
    }

    const requestItems = cart.map(c => {
      const itemSubtotal = c.item.rentalPriceDay * c.quantity * durationDays;
      const itemTaxes = Math.round(itemSubtotal * 0.18);
      return {
        equipmentId: c.item.equipmentId,
        equipmentName: c.item.name,
        quantity: c.quantity,
        durationDays: durationDays,
        dailyCharges: c.item.rentalPriceDay,
        discount: 0,
        securityDeposit: c.item.securityDeposit,
        taxes: itemTaxes,
        subtotal: itemSubtotal,
        total: itemSubtotal + itemTaxes + c.item.securityDeposit,
        expectedReturnDate: returnDate,
        notes: ''
      };
    });

    submitRentalRequest({
      clientId: clientProfile.id,
      clientName: clientProfile.name,
      companyName: clientProfile.companyName,
      startDate,
      endDate: returnDate,
      expectedReturnDate: returnDate,
      items: requestItems,
      securityDepositTotal,
      rentalChargesTotal: subtotal,
      discountTotal: 0,
      gstTotal: estimatedTax,
      additionalCharges: {
        transportation: 0,
        loading: 0,
        unloading: 0,
        delivery: 0,
        damage: 0,
        lateFee: 0
      },
      grandTotal: estimatedGrandTotal,
      paymentStatus: 'Pending',
      paymentMethod: 'Bank Transfer'
    });

    logActivity(
      clientProfile.name,
      'client',
      'Submitted Rental Request',
      'rental',
      `Submitted order request for ${cart.length} equipment items.`
    );

    toast.success('Your rental request has been submitted to Admin approval!');
    setCart([]);
    navigate('/client/dashboard');
  };

  return (
    <div className="space-y-6 text-left text-xs">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-brand-text tracking-tight m-0">Equipment Catalog</h1>
        <p className="text-xs text-brand-dark-grey mt-0.5">Select high-quality heavy machinery, tools, and scaffolding assets to configure your lease.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Catalog search & grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody className="py-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-brand-dark-grey h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search catalog items..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-brand-border rounded-lg text-xs transition-all focus:outline-none focus:border-primary text-brand-text"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-brand-text font-semibold"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </CardBody>
          </Card>

          {/* Grid of items */}
          {availableItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableItems.map(item => (
                <Card key={item.id} className="overflow-hidden flex flex-col justify-between">
                  <div className="relative">
                    <img src={item.images[0]} alt={item.name} className="h-44 w-full object-cover border-b border-brand-border" />
                    <span className="absolute top-2.5 right-2.5">
                      <Badge variant="success">Available</Badge>
                    </span>
                  </div>
                  <CardBody className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-primary block">{item.category}</span>
                      <h4 className="font-extrabold text-brand-text text-sm mt-0.5 leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-brand-dark-grey mt-1">Brand: <strong>{item.brand}</strong> | Model: <strong>{item.model}</strong></p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-border/40">
                      <Button variant="primary" size="sm" className="w-full" onClick={() => addToCart(item)}>
                        Add to Lease Cart
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No Available Assets" description="All items matching your filter criteria are currently on lease. Try choosing another category." />
          )}
        </div>

        {/* Right Side: Cart configuration summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HiOutlineShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-xs text-brand-text uppercase tracking-wider">Lease Cart</h3>
              </div>
              <span className="font-bold text-primary">{cart.length} Items</span>
            </CardHeader>
            <CardBody className="space-y-4">
              {cart.length > 0 ? (
                <form onSubmit={handleSubmitCart} className="space-y-4">
                  {/* Cart items list */}
                  <div className="space-y-3.5 max-h-60 overflow-y-auto">
                    {cart.map(({ item }) => (
                      <div key={item.id} className="flex justify-between items-center gap-3 p-2.5 bg-brand-light-grey rounded-xl border border-brand-border">
                        <div>
                          <span className="font-bold text-brand-text block">{item.name}</span>
                          <span className="text-[10px] text-brand-dark-grey mt-0.5">Brand: {item.brand} | Model: {item.model}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1 text-red-600 hover:text-red-700 shrink-0" onClick={() => removeFromCart(item.id)}>
                          <HiOutlineTrash className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Dates config */}
                  <div className="space-y-3.5 pt-3 border-t border-brand-border">
                    <Input
                      label="Delivery Start Date *"
                      type="date"
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                    
                    <Input
                      label="Expected Return Date *"
                      type="date"
                      required
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                    />

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-brand-text">Lease Duration Days:</span>
                      <strong className="text-primary text-xs font-extrabold">{durationDays} Days</strong>
                    </div>
                  </div>

                  {/* Price display hidden as per client requirements */}

                  {/* Submission */}
                  <Button variant="primary" size="lg" className="w-full mt-2" type="submit">
                    Propose Request to Admin
                  </Button>
                </form>
              ) : (
                <div className="py-8 text-center text-brand-dark-grey">
                  <HiOutlineShoppingBag className="h-8 w-8 text-brand-dark-grey/30 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-brand-text">Your cart is empty.</p>
                  <p className="text-[10px] text-brand-dark-grey mt-0.5">Add equipment assets from the catalog to submit a rental query.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default RentalCart;
