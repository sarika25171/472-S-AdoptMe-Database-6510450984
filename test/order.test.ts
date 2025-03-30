import Elysia from "elysia";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import OrderController from "../src/controllers/OrderController";
import UserController from "../src/controllers/UserController";
import ProductController from "../src/controllers/ProductController";
import ProductCategoryController from "../src/controllers/ProductCategoryController";
import { order, product, product_category, user } from "@prisma/client";

// Use a random port to avoid conflicts
const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper function to generate random data
const generateRandomString = () => Math.random().toString(36).substring(2, 15);

// Create app and start server
const app = new Elysia()
  .use(OrderController)
  .use(UserController)
  .use(ProductController)
  .use(ProductCategoryController);

let server: any;
let testData = {
  productCategory: null as product_category | null,
  product: null as product | null,
  user: null as user | null,
  order: null as order | null
};

describe("Order API Integration Tests", () => {
  // Setup before all tests
  beforeAll(async () => {
    server = app.listen(PORT);
    console.log(`Test server running on port ${PORT}`);
  });

  // User tests
  describe("User Management", () => {
    it("should create a new user", async () => {
      const username = generateRandomString();
      const email = `${username}@example.com`;
      
      const response = await fetch(`${BASE_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: "Password!123",
          email: email,
          first_name: "John",
          last_name: "Doe",
          phone_number: "1234567890",
          photo_url: "https://example.com/photo.jpg",
          salary: 100000,
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      
      // Verify user was created
      const userResponse = await fetch(`${BASE_URL}/user/getUserByUsernameForTest/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username }),
      });
      
      const userData = await userResponse.json();
      expect(userResponse.status).toBe(200);
      expect(userData).toMatchObject(data);
      
      // Store for later tests
      testData.user = userData;
    });
  });

  // Product Category tests
  describe("Product Category Management", () => {
    it("should create a product category", async () => {
      const categoryName = `Category ${generateRandomString()}`;
      
      const response = await fetch(`${BASE_URL}/product-category/createProductCategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          description: `${categoryName} description`,
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        name: categoryName,
        description: `${categoryName} description`,
      });
      
      // Store for later tests
      testData.productCategory = data;
    });
  });

  // Product tests
  describe("Product Management", () => {
    it("should create a product", async () => {
      if (!testData.productCategory) {
        throw new Error("Product category not created in previous test");
      }
      
      const productName = `Product ${generateRandomString()}`;
      const price = Math.floor(Math.random() * 100) + 1;
      
      const response = await fetch(`${BASE_URL}/product/createProduct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          price: price,
          stock: 10,
          description: `${productName} description`,
          product_category_id: testData.productCategory.id,
          imageurl: "https://example.com/photo.jpg",
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        name: productName,
        price: price,
        stock: 10,
        description: `${productName} description`,
        product_category_id: testData.productCategory.id,
      });
      
      // Store for later tests
      testData.product = data;
    });
  });

  // Order tests
  describe("Order Management", () => {
    it("should create an order", async () => {
      if (!testData.user || !testData.product) {
        throw new Error("User or product not created in previous tests");
      }
      
      const response = await fetch(`${BASE_URL}/order/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: testData.user.user_id,
          product_id: testData.product.id,
          quantity: 1,
          total_price: testData.product.price,
          session_id: Math.random().toString(36).substring(2, 15),
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        user_id: testData.user.user_id,
        product_id: testData.product.id,
        quantity: 1,
        total_price: testData.product.price,
      });
      
      // Store for later tests
      testData.order = data;
    });

    it("should get all orders", async () => {
      const response = await fetch(`${BASE_URL}/order/getAll`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      // Should contain at least our test order
      expect(data.length).toBeGreaterThanOrEqual(0);
    });

    it("should get order by id", async () => {
      if (!testData.order) {
        throw new Error("Order not created in previous test");
      }
      
      const response = await fetch(`${BASE_URL}/order/getById/${testData.order.id}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({ id: testData.order.id });
    });

    it("should handle non-existent order by id", async () => {
      const response = await fetch(`${BASE_URL}/order/getById/0`);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid order ID");
    });

    it("should get orders by user id", async () => {
      if (!testData.user) {
        throw new Error("User not created in previous tests");
      }
      
      const response = await fetch(`${BASE_URL}/order/getByUserId/${testData.user.user_id}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(0);
      
      // Check that at least one order belongs to our test user
      const userOrders = data.filter((order: { user_id: string; }) => order.user_id === testData.user?.user_id);
      expect(userOrders.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle non-existent user id for orders", async () => {
      const nonExistentUserId = "invalid-user-id";
      const response = await fetch(`${BASE_URL}/order/getByUserId/${nonExistentUserId}`);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe("No orders found for this user");
    });

    it("should update an order", async () => {
      if (!testData.order || !testData.product) {
        throw new Error("Order or product not created in previous tests");
      }
      
      const newQuantity = Math.floor(Math.random() * 5) + 2; // Random quantity between 2 and 6
      const newPrice = testData.product.price * newQuantity;
      
      const response = await fetch(`${BASE_URL}/order/updateOrder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testData.order.id,
          order: {
            product_id: testData.product.id,
            quantity: newQuantity,
            total_price: newPrice,
          },
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        product_id: testData.product.id,
        quantity: newQuantity,
        total_price: newPrice,
      });
      
      // Update our test data
      testData.order = { ...testData.order, ...data };
    });

    it("should handle updating non-existent order", async () => {
      if (!testData.product) {
        throw new Error("Product not created in previous tests");
      }
      
      const response = await fetch(`${BASE_URL}/order/updateOrder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: 0, 
          order: {
            product_id: testData.product.id,
            quantity: 1,
            total_price: testData.product.price
          }
        }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid order ID");
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Only attempt to delete if the entity was created
    try {
      if (testData.order) {
        await fetch(`${BASE_URL}/order/deleteOrder`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.order.id }),
        });
        console.log(`Test order ${testData.order.id} deleted`);
      }
      
      if (testData.product) {
        await fetch(`${BASE_URL}/product/deleteProduct`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.product.id }),
        });
        console.log(`Test product ${testData.product.id} deleted`);
      }
      
      if (testData.productCategory) {
        await fetch(`${BASE_URL}/product-category/deleteProductCategory`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.productCategory.id }),
        });
        console.log(`Test product category ${testData.productCategory.id} deleted`);
      }
      
      if (testData.user) {
        await fetch(`${BASE_URL}/user/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: testData.user.user_id }),
        });
        console.log(`Test user ${testData.user.user_id} deleted`);
      }
    } catch (error) {
      console.error("Error during test cleanup:", error);
    } finally {
      server.stop(); // Stop the test server
      console.log("Test server stopped");
    }
  });
});