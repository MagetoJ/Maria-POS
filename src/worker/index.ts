import { Hono } from "hono";

interface Env {
  R2_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// Upload product image
app.post("/api/products/:productId/image", async (c) => {
  try {
    const productId = c.req.param("productId");
    const formData = await c.req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return c.json({ error: "No image file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." }, 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: "File size too large. Maximum size is 5MB." }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const key = `products/${productId}/${timestamp}.${fileExtension}`;

    // Upload to R2
    const object = await c.env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    if (!object) {
      return c.json({ error: "Failed to upload image" }, 500);
    }

    // Return the key that can be used to construct the URL
    return c.json({
      success: true,
      key: key,
      url: `/api/images/${key}`,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get product image
app.get("/api/images/*", async (c) => {
  try {
    const path = c.req.path.replace("/api/images/", "");
    
    if (!path) {
      return c.json({ error: "Image path required" }, 400);
    }

    const object = await c.env.R2_BUCKET.get(path);
    
    if (!object) {
      return c.json({ error: "Image not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000"); // Cache for 1 year

    return c.body(object.body, { headers });

  } catch (error) {
    console.error('Image retrieval error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete product image
app.delete("/api/products/:productId/image", async (c) => {
  try {
    const productId = c.req.param("productId");
    const { key } = await c.req.json();

    if (!key) {
      return c.json({ error: "Image key required" }, 400);
    }

    // Verify the key belongs to this product
    if (!key.startsWith(`products/${productId}/`)) {
      return c.json({ error: "Invalid image key for this product" }, 400);
    }

    await c.env.R2_BUCKET.delete(key);

    return c.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
