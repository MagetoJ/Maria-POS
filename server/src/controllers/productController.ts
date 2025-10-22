import { Request, Response } from 'express';
import db from '../db';

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    
    let query = db('products')
      .select('*')
      .where('is_active', true)
      .orderBy('name', 'asc');

    if (category_id && category_id !== 'all') {
      query = query.where('category_id', category_id);
    }

    const products = await query;
    res.json(products);

  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await db('products')
      .where({ id, is_active: true })
      .first();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);

  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// Create new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      category_id, // <-- FIX
      price,
      cost, // <-- ADD THIS
      description,
      preparation_time, // <-- ADD THIS
      image_url, // <-- FIX (matches frontend)
      is_available
    } = req.body;

    // Validation
    if (!name || !category_id || price === undefined) {
      return res.status(400).json({ 
        message: 'Name, category_id, and price are required' 
      });
    }

    // Check if product name already exists in the same category_id
    const existingProduct = await db('products')
      .where({ name, category_id, is_active: true })
      .first();

    if (existingProduct) {
      return res.status(400).json({ 
        message: 'Product with this name already exists in this category_id' 
      });
    }

  const [newProduct] = await db('products')
      .insert({
        name,
        category_id, // <-- FIX
        price,
        cost: cost || 0, // <-- ADD THIS
        description: description || '',
        preparation_time: preparation_time || 0, // <-- ADD THIS
        image_url: image_url || null, // <-- FIX
        // 'ingredients' is not in your frontend or DB schema, so it's removed.
        is_available: is_available !== undefined ? is_available : true,
        is_active: true,
        // created_at and updated_at are usually handled by the database
      })
      .returning('*');

    res.status(201).json(newProduct);

  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };

    // Check if product exists
    const existingProduct = await db('products').where({ id }).first();
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If updating name/category_id, check for duplicates
   if (updateData.name || updateData.category_id) { // <-- FIX
      const name = updateData.name || existingProduct.name;
      const category_id = updateData.category_id || existingProduct.category_id; // <-- FIX
      
      const duplicateProduct = await db('products')
        .where({ name, category_id, is_active: true }) // <-- FIX
        .whereNot({ id })
        .first();

      if (duplicateProduct) {
        return res.status(400).json({ 
          message: 'Product with this name already exists in this category_id' 
        });
      }
    }

    const [updatedProduct] = await db('products')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedProduct);

  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await db('products').where({ id }).first();
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete by setting is_active to false
    await db('products')
      .where({ id })
      .update({ 
        is_active: false,
        updated_at: new Date() 
      });

    res.json({ message: 'Product deleted successfully' });

  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// Get product categories
export const getProductCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db('products')
      .distinct('category_id')
      .where('is_active', true)
      .orderBy('category_id', 'asc');

    const category_idList = categories.map(cat => cat.category_id).filter(Boolean);
    
    res.json(category_idList);

  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Toggle product availability
export const toggleProductAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [updatedProduct] = await db('products')
      .where({ id })
      .update({ 
        is_available: !product.is_available,
        updated_at: new Date() 
      })
      .returning('*');

    res.json(updatedProduct);

  } catch (err) {
    console.error('Error toggling product availability:', err);
    res.status(500).json({ message: 'Error toggling product availability' });
  }
};