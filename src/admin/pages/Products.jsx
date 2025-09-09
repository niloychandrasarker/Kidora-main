import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import apiService from '../../services/apiService';
import RichTextEditor from '../components/RichTextEditor';

export default function Products() {
  const additionalInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: 'men',
    discount: '0',
  rating: '4.5',
    videoUrl: '',
  availableSizes: [],
  });

  const [files, setFiles] = useState({
    mainImage: null,
  additionalImages: []
  });

  const [previewImages, setPreviewImages] = useState({
    mainImage: null,
    additionalImages: []
  });

  // For edit mode: track existing server-hosted additional images separately
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);

  // Remove a newly selected additional image before submit
  const removeAdditionalImageAt = (index) => {
    setPreviewImages(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
    setFiles(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const clearMainImage = () => {
    setPreviewImages(prev => ({ ...prev, mainImage: null }));
    setFiles(prev => ({ ...prev, mainImage: null }));
  };

  // Load products from backend
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllProducts(0, 100); // Load all products
      const data = response?.data ?? response;
      const list = Array.isArray(data)
        ? data
        : (Array.isArray(data?.products) ? data.products : (data?.content || []));
      setProducts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const allSizes = ['XS','S','M','L','XL','XXL'];
  const toggleSize = (size) => {
    setFormData(prev => {
      const set = new Set(prev.availableSizes || []);
      if (set.has(size)) set.delete(size); else set.add(size);
      return { ...prev, availableSizes: Array.from(set) };
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    
    if (name === 'mainImage') {
      const file = selectedFiles[0];
      setFiles(prev => ({ ...prev, mainImage: file }));
      
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages(prev => ({ ...prev, mainImage: e.target.result }));
        };
        reader.readAsDataURL(file);
      }
    } else if (name === 'additionalImages') {
      const fileArray = Array.from(selectedFiles);
      setFiles(prev => ({ ...prev, additionalImages: [...prev.additionalImages, ...fileArray] }));
      
      const promises = fileArray.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(promises).then(results => {
        setPreviewImages(prev => ({ ...prev, additionalImages: [...prev.additionalImages, ...results] }));
      });

      // Reset input so the same file can be selected again if needed
      if (additionalInputRef.current) {
        additionalInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.mainImage && !editingProduct) {
      alert('Please select a main image');
      return;
    }

    try {
      const submitFormData = new FormData();
      
      // Add text fields
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price);
      submitFormData.append('stock', formData.stock);
      submitFormData.append('category', formData.category);
  submitFormData.append('discount', formData.discount);
  if (formData.rating !== '') submitFormData.append('rating', formData.rating);
      if (formData.videoUrl) {
        submitFormData.append('videoUrl', formData.videoUrl);
      }

      // Add files
      if (files.mainImage) {
        submitFormData.append('mainImage', files.mainImage);
      }
      
      if (files.additionalImages.length > 0) {
        files.additionalImages.forEach(file => {
          submitFormData.append('additionalImages', file);
        });
      }

      // Add available sizes as repeated form fields
      if (Array.isArray(formData.availableSizes)) {
        formData.availableSizes.forEach(s => submitFormData.append('availableSizes', s));
      }

      // For updates, include kept existing images (exclude main image URL)
      if (editingProduct && existingAdditionalImages.length > 0) {
        existingAdditionalImages.forEach(url => submitFormData.append('existingImages', url));
      }

      let response;
      if (editingProduct) {
        response = await apiService.updateProduct(editingProduct.id, submitFormData);
      } else {
        response = await apiService.createProduct(submitFormData);
      }

      // Treat as success if no explicit failure flag present
      if (!response || response.success === false) {
        alert(response?.message || 'Failed to save product');
      } else {
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        await loadProducts(); // Reload products
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || 'men',
  discount: product.discount || '0',
  rating: (product.rating ?? '0').toString(),
      videoUrl: product.videoUrl || '',
  availableSizes: Array.isArray(product.availableSizes) ? product.availableSizes : [],
    });
    
    // Set preview images for editing
    setPreviewImages({
      mainImage: product.mainImage || null,
      additionalImages: []
    });
    // Keep server-hosted existing additional images separate
    setExistingAdditionalImages(product.images ? product.images.slice(1) : []);
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiService.deleteProduct(id);
        alert('Product deleted successfully!');
        await loadProducts(); // Reload products
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      stock: '',
      category: 'men',
      discount: '0',
  rating: '4.5',
      videoUrl: '',
  availableSizes: [],
    });
    setFiles({
      mainImage: null,
      additionalImages: []
    });
    setPreviewImages({
      mainImage: null,
      additionalImages: []
    });
    setExistingAdditionalImages([]);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'kids', label: 'Kids' },
    { value: 'rich', label: 'Premium' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <Button onClick={() => setShowModal(true)}>
          Add New Product
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={product.mainImage || product.image}
                alt={product.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                  {product.title}
                </h3>
                <Badge variant={product.stock > 0 ? 'success' : 'danger'}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-semibold">৳{product.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stock:</span>
                  <span>{product.stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="capitalize">{product.category}</span>
                </div>
                {product.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount:</span>
                    <span className="text-green-600">{product.discount}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found.</p>
        </div>
      )}

      {/* Add/Edit Product Modal */}
  <Modal open={showModal} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter product title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <RichTextEditor value={formData.description} onChange={handleInputChange} />
              <div className="mt-2 p-3 border rounded-md bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Preview</div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{formData.description}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (0 - 5)
                </label>
                <Input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={handleInputChange}
                  placeholder="4.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (৳) *
                </label>
                <Input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <Input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="rich">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <Input
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Available Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((s) => (
                  <label key={s} className={`inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer ${(formData.availableSizes || []).includes(s) ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={(formData.availableSizes || []).includes(s)}
                      onChange={() => toggleSize(s)}
                    />
                    <span className="text-sm font-medium">{s}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select only the sizes that are in stock for this product.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (Optional)
              </label>
              <Input
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Image {!editingProduct && '*'}
              </label>
              <input
                type="file"
                name="mainImage"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!editingProduct}
              />
              {previewImages.mainImage && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={previewImages.mainImage}
                    alt="Main preview"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={clearMainImage}
                    className="absolute -top-2 -right-2 bg-white border rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-gray-50"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Images (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={additionalInputRef}
                  type="file"
                  name="additionalImages"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => additionalInputRef.current?.click()}>
                  + Add Images
                </Button>
                {previewImages.additionalImages.length > 0 && (
                  <span className="text-xs text-gray-500">{previewImages.additionalImages.length} selected</span>
                )}
              </div>
              
              {editingProduct && existingAdditionalImages.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">Selecting new additional images will replace existing ones on save.</p>
              )}
              {editingProduct && existingAdditionalImages.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {existingAdditionalImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={image}
                        alt={`Existing ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => setExistingAdditionalImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-gray-50"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {previewImages.additionalImages.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {previewImages.additionalImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      {files.additionalImages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAdditionalImageAt(index)}
                          className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-gray-50"
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
