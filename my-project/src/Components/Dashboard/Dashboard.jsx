import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ToggleButton } from 'primereact/togglebutton';
import { Button } from 'primereact/button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Dashboard.css';
import NavBar from '../NavBar/NavBar';

const ProductExpiryTracker = () => {
  const { session } = useAuth();
  const categories = [
    { name: 'Dairy', code: 'DA' },
    { name: 'Meat', code: 'ME' },
    { name: 'Vegetables', code: 'VG' },
    { name: 'Fruits', code: 'FR' },
    { name: 'Bakery', code: 'BK' }
  ];

  const brands = [
    { name: 'Brand A', code: 'BA' },
    { name: 'Brand B', code: 'BB' },
    { name: 'Brand C', code: 'BC' }
  ];

  const emptyProduct = {
    code: '',
    name: '',
    brand: null,
    category: null,
    expiry_date: null,
    quantity: 0,
    taken_out: false
  };

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ ...emptyProduct });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData?.role !== 'admin') {
          query = query.eq('user_id', session.user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setProducts(data?.map(p => ({
        ...p,
        expiry_date: p.expiry_date ? new Date(p.expiry_date) : null,
        brand: brands.find(b => b.name === p.brand) || null,
        category: categories.find(c => c.name === p.category) || null
      })) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    setNewProduct({ ...newProduct, [field]: e.value });
  };

  const handleTextChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.id]: e.target.value });
  };

  const addProduct = async () => {
    if (!newProduct.code || !newProduct.name) return;
    setLoading(true);
    
    try {
      const productToAdd = {
        ...newProduct,
        user_id: session.user.id,
        brand: newProduct.brand?.name || null,
        category: newProduct.category?.name || null,
        expiry_date: newProduct.expiry_date?.toISOString(),
        taken_out: false
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productToAdd])
        .select();

      if (error) throw error;

      setProducts([...products, {
        ...data[0],
        expiry_date: data[0].expiry_date ? new Date(data[0].expiry_date) : null
      }]);
      setNewProduct({ ...emptyProduct });
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaken_out = async (rowData) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ taken_out: !rowData.taken_out })
        .eq('id', rowData.id);

      if (error) throw error;

      const updatedProducts = products.map(product => 
        product.id === rowData.id ? { ...product, taken_out: !product.taken_out } : product
      );
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const taken_outBodyTemplate = (rowData) => {
    return (
      <ToggleButton
        checked={rowData.taken_out}
        onChange={() => toggleTaken_out(rowData)}
        onLabel="Taken"
        offLabel="Available"
        onIcon="pi pi-check"
        offIcon="pi pi-times"
        disabled={loading}
      />
    );
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-sm"
        onClick={() => deleteProduct(rowData.id)}
        disabled={loading}
      />
    );
  };

  return (
    <div className="dashboard-container">
      <h1>Product Expiry Tracker</h1>
      <NavBar />
      
      <div className="input-row">
        <div className="input-group">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-barcode"></i>
            </span>
            <InputText 
              id="code" 
              value={newProduct.code} 
              onChange={handleTextChange} 
              placeholder="Product Code" 
              disabled={loading}
            />
          </div>
        </div>

        <div className="input-group">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-tag"></i>
            </span>
            <InputText 
              id="name" 
              value={newProduct.name} 
              onChange={handleTextChange} 
              placeholder="Product Name" 
              disabled={loading}
            />
          </div>
        </div>

        <div className="input-group">
          <Dropdown 
            value={newProduct.brand} 
            onChange={(e) => handleInputChange(e, 'brand')} 
            options={brands} 
            optionLabel="name" 
            placeholder="Select Brand" 
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <Dropdown 
            value={newProduct.category} 
            onChange={(e) => handleInputChange(e, 'category')} 
            options={categories} 
            optionLabel="name" 
            placeholder="Select Category" 
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <Calendar 
            value={newProduct.expiry_date} 
            onChange={(e) => handleInputChange(e, 'expiry_date')} 
            placeholder="Expiry Date" 
            dateFormat="dd/mm/yy" 
            showIcon 
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <InputNumber 
            value={newProduct.quantity} 
            onValueChange={(e) => handleInputChange(e, 'quantity')} 
            placeholder="Qty" 
            disabled={loading}
          />
        </div>

        <div className="input-group add-button-container">
          <Button 
            label="Add" 
            icon="pi pi-plus" 
            onClick={addProduct} 
            disabled={!newProduct.code || !newProduct.name || loading} 
            className="add-button"
            loading={loading}
          />
        </div>
      </div>
      
      <div className="card">
        <DataTable 
          value={products} 
          loading={loading}
          paginator
          rows={10}
          emptyMessage="No products found"
        >
          <Column field="code" header="Code" sortable />
          <Column field="name" header="Name" sortable />
          <Column field="brand.name" header="Brand" sortable />
          <Column field="category.name" header="Category" sortable />
          <Column 
            field="expiry_date" 
            header="Expiry Date" 
            body={(rowData) => rowData.expiry_date?.toLocaleDateString() || 'N/A'} 
            sortable 
          />
          <Column field="quantity" header="Quantity" sortable />
          <Column 
            header="Status" 
            body={taken_outBodyTemplate} 
            style={{ textAlign: 'center' }}
          />
          {session?.user?.role === 'admin' && (
            <Column 
              field="user_id" 
              header="Owner" 
              body={(rowData) => rowData.user_id === session.user.id ? 'You' : rowData.user_id}
            />
          )}
          <Column 
            header="Actions" 
            body={actionBodyTemplate} 
            style={{ width: '80px', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default ProductExpiryTracker;