import Elysia from "elysia";
import { afterAll, describe, expect, it } from "bun:test";
import OrderController from "../src/controllers/OrderController";
import UserController from "../src/controllers/UserController";
import ProductController from "../src/controllers/ProductController";
import ProductCategoryController from "../src/controllers/ProductCategoryController";
import { order, product, product_category, user } from "@prisma/client";

const app = new Elysia()
  .use(OrderController)
  .use(UserController)
  .use(ProductController)
  .use(ProductCategoryController);
const server = app.listen(3000);
let productCategoryTest: product_category = {
  id: 0,
  name: "Product Category 1",
  description: "Product Category 1 description",
  createdAt: new Date(),
  updatedAt: new Date(),
};
let productTest: product;
let userTest: user | null = null;
let orderTest: order | null = null;

describe("OrderController API Tests", () => {
  it("create user", async () => {
    const username = Math.random().toString(36).substring(2, 15);
    const email = username + "@example.com";
    console.log("username: ", username);
    const response = await fetch("http://localhost:3000/api/user/register", {
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

    const responseUser = await fetch(
      "http://localhost:3000/api/user/getUserByUsernameForTest/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username }),
      }
    );
    const dataUser = await responseUser.json();
    expect(responseUser.status).toBe(200);
    expect(dataUser).toMatchObject(data);
    userTest = dataUser;
  });

  it("create product category", async () => {
    const response = await fetch(
      "http://localhost:3000/api/product-category/createProductCategory",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productCategoryTest.name,
          description: productCategoryTest.description,
        }),
      }
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      name: productCategoryTest.name,
      description: productCategoryTest.description,
    });
    productCategoryTest = data;
  });

  it("create product", async () => {
    const name = Math.random().toString(36).substring(2, 15);
    const response = await fetch(
      "http://localhost:3000/api/product/createProduct",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          price: 10,
          stock: 10,
          description: name + " description",
          product_category_id: 1,
          imageurl: "https://example.com/photo.jpg",
        }),
      }
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      name: name,
      price: 10,
      stock: 10,
      description: name + " description",
      product_category_id: 1,
      imageurl: "https://example.com/photo.jpg",
    });
    productTest = data;
  });

  it("create order", async () => {
    const response = await fetch(
      "http://localhost:3000/api/order/createOrder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userTest?.user_id,
          product_id: productTest.id,
          quantity: 1,
          total_price: productTest.price,
          session_id: "1234567890",
        }),
      }
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      user_id: userTest?.user_id,
      product_id: productTest.id,
      quantity: 1,
      total_price: productTest.price,
      session_id: "1234567890",
    });
    orderTest = data;
  });

  it("get all orders", async () => {
    const response = await fetch("http://localhost:3000/api/order/getAll");
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("get order by id", async () => {
    const response = await fetch(
      `http://localhost:3000/api/order/getById/${orderTest?.id}`
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({ id: orderTest?.id });
  });

  it("get non-existent order by id", async () => {
    const response = await fetch("http://localhost:3000/api/order/getById/0");
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid order ID");
  });

  it("get orders by user id", async () => {
    const response = await fetch(
      `http://localhost:3000/api/order/getByUserId/${userTest?.user_id}`
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("get non-existent orders by user id", async () => {
    const response = await fetch(
      "http://localhost:3000/api/order/getByUserId/0"
    );
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe("No orders found for this user");
  });

  it("update order", async () => {
    const response = await fetch(
      "http://localhost:3000/api/order/updateOrder",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderTest?.id,
          order: {
            product_id: productTest.id,
            quantity: 2,
            total_price: productTest.price * 2,
          },
        }),
      }
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      product_id: productTest.id,
      quantity: 2,
      total_price: productTest.price * 2,
    });
  });

  it("update non-existent order", async () => {
    const response = await fetch(
      "http://localhost:3000/api/order/updateOrder",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 0, order: {} }),
      }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid order ID");
  });

  afterAll(async () => {
    await fetch("http://localhost:3000/api/order/deleteOrder", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderTest?.id }),
    });
    await fetch("http://localhost:3000/api/product/deleteProduct", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productTest.id }),
    });
    await fetch(
      "http://localhost:3000/api/product-category/deleteProductCategory",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productCategoryTest.id }),
      }
    );
    await fetch("http://localhost:3000/api/user/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userTest?.user_id }),
    });
    server.stop(); // Stop the test server
  });
});
