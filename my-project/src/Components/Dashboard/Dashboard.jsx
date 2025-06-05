
  import React, { useState, useEffect } from 'react';
  import { DataTable } from 'primereact/datatable';
  import { Column } from 'primereact/column';
  import { InputText } from 'primereact/inputtext';
  import { InputNumber } from 'primereact/inputnumber';
  import { Dropdown } from 'primereact/dropdown';
  import { Calendar } from 'primereact/calendar';
  import { ToggleButton } from 'primereact/togglebutton';
  import { Button } from 'primereact/button';
  import { Dialog } from 'primereact/dialog';
  import { useAuth } from '../../context/AuthContext';
  import { supabase } from '../../lib/supabaseClient';
  import 'primereact/resources/themes/lara-light-indigo/theme.css';
  import 'primereact/resources/primereact.min.css';
  import 'primeicons/primeicons.css';
  import './Dashboard.css';
  import NavBar from '../NavBar/NavBar';

  import {
    configure,
    DataCaptureContext,
  } from "@scandit/web-datacapture-core";
  import {
    barcodeCaptureLoader,
    SparkScan,
    SparkScanSettings,
    SparkScanView,
    SparkScanViewSettings,
    Symbology,
  } from "@scandit/web-datacapture-barcode";

  const ProductExpiryTracker = () => {
    const { session } = useAuth();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // For storing all products in the database
    const [newProduct, setNewProduct] = useState({ 
      code: '',
      name: '',
      brand: null,
      category: null,
      expiry_date: null,
      quantity: 0,
      taken_out: false
    });
    const [loading, setLoading] = useState({
      products: false,
      categories: false,
      brands: false,
      productSearch: false
    });
    const [search, setSearch] = useState({
      brand: '',
      category: ''
    });
    const [scannerVisible, setScannerVisible] = useState(false);
    const [showAddProductDialog, setShowAddProductDialog] = useState(false);
    const [scannedCode, setScannedCode] = useState('');

    useEffect(() => {
      if (session) {
        fetchProducts();
        fetchCategories();
        fetchBrands();
        fetchAllProducts(); // Fetch all products for barcode lookup
      }
    }, [session]);

    useEffect(() => {
      filterCategories();
    }, [search.category, categories]);

    useEffect(() => {
      filterBrands();
    }, [search.brand, brands]);

    const fetchAllProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setAllProducts(data || []);
      } catch (error) {
        console.error('Error fetching all products:', error);
      }
    };

    const searchProductByCode = async (code) => {
      setLoading(prev => ({ ...prev, productSearch: true }));
      try {
        // First check in the local allProducts array
        const foundProduct = allProducts.find(p => p.code === code);
        
        if (foundProduct) {
          // Autofill the form with the found product
          const brandObj = brands.find(b => b.name === foundProduct.brand) || foundProduct.brand;
          const categoryObj = categories.find(c => c.name === foundProduct.category) || foundProduct.category;
          
          setNewProduct({
            code: foundProduct.code,
            name: foundProduct.name,
            brand: brandObj,
            category: categoryObj,
            expiry_date: null,
            quantity: 0,
            taken_out: false
          });
          
          // Close scanner if open
          setScannerVisible(false);
        } else {
          // If not found, open the add product dialog with the scanned code
          setScannedCode(code);
          setNewProduct(prev => ({
            ...prev,
            code: code
          }));
          setShowAddProductDialog(true);
          setScannerVisible(false);
        }
      } catch (error) {
        console.error('Error searching for product:', error);
      } finally {
        setLoading(prev => ({ ...prev, productSearch: false }));
      }
    };

    const addProduct = async () => {
      if (!newProduct.code || !newProduct.name) return;
      setLoading(prev => ({ ...prev, products: true }));
      
      try {
        const productToAdd = {
          ...newProduct,
          user_id: session.user.id,
          brand: newProduct.brand?.name || newProduct.brand || '',
          category: newProduct.category?.name || newProduct.category || '',
          expiry_date: newProduct.expiry_date?.toISOString(),
          taken_out: false
        };

        // First add to products table if it doesn't exist
        const existingProduct = allProducts.find(p => p.code === newProduct.code);
        if (!existingProduct) {
          const { error: productError } = await supabase
            .from('products')
            .insert([{
              code: newProduct.code,
              name: newProduct.name,
              brand: newProduct.brand?.name || newProduct.brand || '',
              category: newProduct.category?.name || newProduct.category || ''
            }]);
          
          if (productError) throw productError;
          
          // Refresh all products
          await fetchAllProducts();
        }

        // Then add to users_products
        const { data, error } = await supabase
          .from('users_products')
          .insert([productToAdd])
          .select();

        if (error) throw error;

        setProducts([...products, {
          ...data[0],
          expiry_date: data[0].expiry_date ? new Date(data[0].expiry_date) : null,
          brand: data[0].brand || '',
          category: data[0].category || ''
        }]);
        
        // Reset form and close dialog
        setNewProduct({ 
          code: '',
          name: '',
          brand: null,
          category: null,
          expiry_date: null,
          quantity: 0,
          taken_out: false
        });
        setShowAddProductDialog(false);
        setSearch({ brand: '', category: '' });
      } catch (error) {
        console.error('Error adding product:', error);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };


    const toggleTaken_out = async (rowData) => {
      try {
        const { error } = await supabase
          .from('users_products')
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
          disabled={loading.products}
        />
      );
    };

    const deleteProduct = async (id) => {
      if (!window.confirm('Are you sure you want to delete this product?')) return;
      setLoading(prev => ({ ...prev, products: true }));
      
      try {
        const { error } = await supabase
          .from('users_products')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };

    const actionBodyTemplate = (rowData) => {
      return (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => deleteProduct(rowData.id)}
          disabled={loading.products}
        />
      );
    };

    const fetchCategories = async () => {
      setLoading(prev => ({ ...prev, categories: true }));
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
        if (error) throw error;
        setCategories(data || []);
        setFilteredCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    const fetchBrands = async () => {
      setLoading(prev => ({ ...prev, brands: true }));
      try {
        const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
        if (error) throw error;
        setBrands(data || []);
        setFilteredBrands(data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(prev => ({ ...prev, brands: false }));
      }
    };

    const fetchProducts = async () => {
      setLoading(prev => ({ ...prev, products: true }));
      try {
        let query = supabase.from('users_products').select('*').order('expiry_date', { ascending: true });
        if (session) {
          const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
          if (userData?.role !== 'admin') {
            query = query.eq('user_id', session.user.id);
          }
        }
        const { data, error } = await query;
        if (error) throw error;
        setProducts(data?.map(p => ({
          ...p,
          expiry_date: p.expiry_date ? new Date(p.expiry_date) : null,
          brand: p.brand || '',
          category: p.category || ''
        })) || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };

    const filterCategories = () => {
      if (!search.category) setFilteredCategories(categories);
      else setFilteredCategories(categories.filter(c => c.name.toLowerCase().includes(search.category.toLowerCase())));
    };

    const filterBrands = () => {
      if (!search.brand) setFilteredBrands(brands);
      else setFilteredBrands(brands.filter(b => b.name.toLowerCase().includes(search.brand.toLowerCase())));
    };

    const brandDropdownTemplate = (option) => {
      return (
        <div className="brand-option">
          <div>{option.name}</div>
        </div>
      );
    };

    const categoryDropdownTemplate = (option) => {
      return (
        <div className="category-option">
          <div>{option.name}</div>
        </div>
      );
    };

    const brandPanelTemplate = (options) => {
      return (
        <div className="dropdown-panel">
          <div className="search-input-container">
            <InputText
              value={search.brand}
              onChange={(e) => handleSearchChange(e, 'brand')}
              placeholder="Search brands..."
              className="search-input"
            />
            <i className="pi pi-search search-icon" />
          </div>
          <div className="dropdown-items">
            {options}
          </div>
        </div>
      );
    };

    const categoryPanelTemplate = (options) => {
      return (
        <div className="dropdown-panel">
          <div className="search-input-container">
            <InputText
              value={search.category}
              onChange={(e) => handleSearchChange(e, 'category')}
              placeholder="Search categories..."
              className="search-input"
            />
            <i className="pi pi-search search-icon" />
          </div>
          <div className="dropdown-items">
            {options}
          </div>
        </div>
      );
    };


    const handleInputChange = (e, field) => setNewProduct({ ...newProduct, [field]: e.value });
    const handleTextChange = (e) => setNewProduct({ ...newProduct, [e.target.id]: e.target.value });
    const handleSearchChange = (e, field) => setSearch({ ...search, [field]: e.target.value });

    const toggleScanner = async () => {
      setScannerVisible(prev => !prev);
    
      if (!scannerVisible) {
        await configure({
          libraryLocation: new URL(
            "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-barcode@7.3.0/sdc-lib/",
            document.baseURI
          ).toString(),
          licenseKey: "AjlmjzRdEoSVLzVhHs4v9LMas3wxAyHtPyKPQiFB0ScMXO/Hn2An3OBZLJIZT+1xtVONdJd2gPGMU6G93muq9zsPG3UyT1a+hEJH++sICUb0ROSRhh7GDRIo85nocDo8C2uJb8dWW1usbvWg7lCZyhtY+/JXE7KTcGG/yd9rDUCLZ01NBVkEoFlEfP9QajbfXn7ZPx9jsSZJZeO35Uus1KluqK/TZYBa6HDBRDhFqq50Ro5fBmG/7B5LtExNc6Yedk00YR91xwV8QRfdf0o47Z9NIHvBb3n2bEcG8WF+f0k6Ufma2FwR2HR53zjrZaTN0ENhELx7mhIvY7r/aGrIg214ycrfSwI2KC49qeEsYBqqcIxT1mNR+8JJ/qNeH9SloVu1zZ5crTADNgRceyiUVLQmPr75cfgTx0Fldc57r/TOUjR9/nXxKWtI0HmKTQZ5tUnd9VVZNINtXXkNLgH3ig02Op8DALRjrg/6gORPbM3BeXE5XA+aOFZP5nYHRYZMaVRNH311Lyzze39lUCLtOTIY15gjFscsxI3sqC5hpuciYxIcUCw921pXz37/9oXEkmugbl3QICN4XNhJWn/j/BpT0fjT8rBMmUvakYHXC43Eq2LvfEC/Kx3jbFRhN09ZlP4hCleancLbgK0PUMowJ4nFo8VAuCfMp/FvTriu/7tVq96mQDB2OC9HtDcaPlZllmt+CsAPOLiyOmhCS3QT7l59nXCCgYNNnj27gqbjI9TKY/uT94uPvmDgElUxkvGW463waDtAt7ABkLUt3o8a8+aAl+gmrQdFu5WA5MtxEwS0dGWsZHkSbUuUYZPfr2ryWUjEmMOZWsW7+N7bWE0AHHPjHIomn8NFrxe6GZI9ScuEfMiCgp0pQ1BlOYSonh3CKaZcvMoLZuMBbDweEPSNTafPutOYW3x2jRR+11v4FFoEQga1WueYlBvpJXRA1/q5GNZuYZDZcFNSCBtIs722VBbh6W6ZI744xAjWy1ZY2AaJlC1aN6mVDo4+LYJa6DPjMsXkXBqJPnHVurF5ksR/3/PXCiEHV+WeeWIXjcWxhv/uvZdosfmItJVJ7Z4HG28gF2Y+c7tSAWSHDDUKyAvgwF5FjAXt0eKx5He0mXk6100oRZNQmQ41FGLSn305fIttXA04LKp9uDk/sKEvQCdCMcdiCIboh0qgbh9ZVnWWVZj5hvvrAeFx6QU+uk2RZXDfHkI=",
          moduleLoaders: [barcodeCaptureLoader()],
        });
    
        const dataCaptureContext = await DataCaptureContext.create();
        const settings = new SparkScanSettings();
        settings.enableSymbologies([Symbology.EAN13UPCA, Symbology.EAN8]);
    
        const sparkScan = SparkScan.forSettings(settings);
    
        sparkScan.addListener({
          didScan: (_, session) => {
            const barcode = session.newlyRecognizedBarcode;
            if (barcode) {
              let scannedData = barcode.data;
              // If 13 digits and starts with 0, assume it's UPC-A and remove the leading 0
              if (scannedData.length === 13 && scannedData.startsWith('0')) {
                scannedData = scannedData.substring(1);
              }
              // Search for the product by code
              searchProductByCode(scannedData);
            }
          },
        });
    
        dataCaptureContext.setFrameSource(sparkScan.camera);
        await sparkScan.camera?.switchToDesiredState("on");
    
        const viewSettings = new SparkScanViewSettings();
        const view = SparkScanView.forElement(
          document.getElementById("scanner-container"),
          dataCaptureContext,
          sparkScan,
          viewSettings
        );
    
        await view.prepareScanning();
      }
    };

    const addProductDialogFooter = (
      <div>
        <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddProductDialog(false)} className="p-button-text" />
        <Button label="Add" icon="pi pi-check" onClick={addProduct} disabled={!newProduct.code || !newProduct.name || loading.products} autoFocus />
      </div>
    );

    return (
      <div>
        <NavBar />
        <div className="dashboard-container">
          <div className="scanner-container">
            <Button 
              label={scannerVisible ? "Close Scanner" : "Scan Barcode"} 
              onClick={toggleScanner} 
              className="p-button-info scanner-toggle-btn" 
            />
            {scannerVisible && <div id="scanner-container"></div>}
          </div>

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
                  disabled={loading.products}
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
                  disabled={loading.products}
                />
              </div>
            </div>

            <div className="input-group">
              <Dropdown 
                value={newProduct.brand} 
                onChange={(e) => handleInputChange(e, 'brand')} 
                options={filteredBrands} 
                optionLabel="name" 
                placeholder={loading.brands ? "Loading brands..." : "Select Brand"} 
                disabled={loading.products || loading.brands}
                loading={loading.brands}
                itemTemplate={brandDropdownTemplate}
                panelTemplate={brandPanelTemplate}
                filter
                showFilterClear
                resetFilterOnHide
                className="searchable-dropdown"
              />
            </div>

            <div className="input-group">
              <Dropdown 
                value={newProduct.category} 
                onChange={(e) => handleInputChange(e, 'category')} 
                options={filteredCategories} 
                optionLabel="name" 
                placeholder={loading.categories ? "Loading categories..." : "Select Category"} 
                disabled={loading.products || loading.categories}
                loading={loading.categories}
                itemTemplate={categoryDropdownTemplate}
                panelTemplate={categoryPanelTemplate}
                filter
                showFilterClear
                resetFilterOnHide
                className="searchable-dropdown"
              />
            </div>

            <div className="input-group">
              <Calendar 
                value={newProduct.expiry_date} 
                onChange={(e) => handleInputChange(e, 'expiry_date')} 
                placeholder="Expiry Date" 
                dateFormat="dd/mm/yy" 
                showIcon 
                disabled={loading.products}
              />
            </div>

            <div className="input-group">
              <InputNumber 
                value={newProduct.quantity} 
                onValueChange={(e) => handleInputChange(e, 'quantity')} 
                placeholder="Qty" 
                disabled={loading.products}
              />
            </div>

            <div className="input-group add-button-container">
              <Button 
                label="Add" 
                icon="pi pi-plus" 
                onClick={addProduct} 
                disabled={!newProduct.code || !newProduct.name || loading.products} 
                className="add-button"
                loading={loading.products}
              />
            </div>
          </div>
          
          <div className="card">
            <DataTable 
              value={products} 
              loading={loading.products}
              paginator
              rows={10}
              emptyMessage="No products found"
            >
              <Column field="code" header="Code" sortable />
              <Column field="name" header="Name" sortable />
              <Column 
                field="brand" 
                header="Brand" 
                sortable 
                body={(rowData) => rowData.brand || 'N/A'}
              />
              <Column 
                field="category" 
                header="Category" 
                sortable 
                body={(rowData) => rowData.category || 'N/A'}
              />
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

          <Dialog 
            header={`Add New Product (Code: ${scannedCode})`} 
            visible={showAddProductDialog} 
            style={{ width: '50vw' }} 
            footer={addProductDialogFooter} 
            onHide={() => setShowAddProductDialog(false)}
          >
            <div className="dialog-form">
              <div className="input-group">
                <span className="p-float-label">
                  <InputText 
                    id="name" 
                    value={newProduct.name} 
                    onChange={handleTextChange} 
                    disabled={loading.products}
                  />
                  <label htmlFor="name">Product Name</label>
                </span>
              </div>

              <div className="input-group">
                <Dropdown 
                  value={newProduct.brand} 
                  onChange={(e) => handleInputChange(e, 'brand')} 
                  options={filteredBrands} 
                  optionLabel="name" 
                  placeholder={loading.brands ? "Loading brands..." : "Select Brand"} 
                  disabled={loading.products || loading.brands}
                  loading={loading.brands}
                  itemTemplate={brandDropdownTemplate}
                  panelTemplate={brandPanelTemplate}
                  filter
                  showFilterClear
                  resetFilterOnHide
                  className="searchable-dropdown"
                />
              </div>

              <div className="input-group">
                <Dropdown 
                  value={newProduct.category} 
                  onChange={(e) => handleInputChange(e, 'category')} 
                  options={filteredCategories} 
                  optionLabel="name" 
                  placeholder={loading.categories ? "Loading categories..." : "Select Category"} 
                  disabled={loading.products || loading.categories}
                  loading={loading.categories}
                  itemTemplate={categoryDropdownTemplate}
                  panelTemplate={categoryPanelTemplate}
                  filter
                  showFilterClear
                  resetFilterOnHide
                  className="searchable-dropdown"
                />
              </div>

              <div className="input-group">
                <span className="p-float-label">
                  <Calendar 
                    value={newProduct.expiry_date} 
                    onChange={(e) => handleInputChange(e, 'expiry_date')} 
                    dateFormat="dd/mm/yy" 
                    showIcon 
                    disabled={loading.products}
                  />
                  <label>Expiry Date</label>
                </span>
              </div>

              <div className="input-group">
                <span className="p-float-label">
                  <InputNumber 
                    value={newProduct.quantity} 
                    onValueChange={(e) => handleInputChange(e, 'quantity')} 
                    disabled={loading.products}
                  />
                  <label>Quantity</label>
                </span>
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    );
  };

  export default ProductExpiryTracker;