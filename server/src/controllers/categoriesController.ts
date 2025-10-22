import { Request, Response } from 'express';
import db from '../db';

// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db('categories')
      .select('*')
      .orderBy('name', 'asc');

    // If no categories exist, return distinct categories from products table
    if (categories.length === 0) {
      const productCategories = await db('products')
        .distinct('category')
        .whereNotNull('category')
        .where('category', '!=', '')
        .select('category as name')
        .orderBy('category', 'asc');

      // Create basic category structure from product categories
      const categoriesFromProducts = productCategories.map((cat, index) => ({
        id: `temp-${index}`,
        name: cat.name,
        description: `Category for ${cat.name}`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      return res.json(categoriesFromProducts);
    }

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, is_active = true } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await db('categories')
      .where({ name })
      .first();

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Ensure categories table exists
    const hasTable = await db.schema.hasTable('categories');
    if (!hasTable) {
      await db.schema.createTable('categories', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.unique('name');
      });
    }

    const [insertedCategory] = await db('categories')
      .insert({
        name,
        description,
        is_active,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    const newCategory = insertedCategory;

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category exists
    const existingCategory = await db('categories')
      .where('id', id)
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check for duplicate name (excluding current category)
    const duplicateCategory = await db('categories')
      .where('name', name)
      .where('id', '!=', id)
      .first();

    if (duplicateCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    await db('categories')
      .where('id', id)
      .update({
        name,
        description,
        is_active,
        updated_at: new Date()
      });

    const updatedCategory = await db('categories')
      .where('id', id)
      .first();

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await db('categories')
      .where('id', id)
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is used by products
    const productsUsingCategory = await db('products')
      .where('category', existingCategory.name)
      .count('id as count')
      .first();

    if (productsUsingCategory && Number(productsUsingCategory.count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category as it is used by products. Please update products first.' 
      });
    }

    await db('categories')
      .where('id', id)
      .del();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update category status
export const updateCategoryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active must be a boolean value' });
    }

    // Check if category exists
    const existingCategory = await db('categories')
      .where('id', id)
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await db('categories')
      .where('id', id)
      .update({
        is_active,
        updated_at: new Date()
      });

    const updatedCategory = await db('categories')
      .where('id', id)
      .first();

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};