import Elysia from "elysia";
import CartController from "../src/controllers/CartController";
import { afterAll, describe, expect, it } from "bun:test";
import ProductController from "../src/controllers/ProductController";
import ProductCategoryController from "../src/controllers/ProductCategoryController";
import UserController from "../src/controllers/UserController";
import { product, product_category, user } from "@prisma/client";

const app = new Elysia().use(CartController).use(UserController).use(ProductController).use(ProductCategoryController);
const server = app.listen(3000);
let productCategoryTest: product_category = {
    id: 0,
    name: "Product Category 1",
    description: "Product Category 1 description",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let productTest: product;
  let productTest2: product;
  let userTest: user | null = null;

describe("CartController API Tests", () => {

    it("create user", async () => {
        const username = Math.random().toString(36).substring(2, 15);
        const email = username + "@example.com";
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
              stock: 100,
              description: name + " description",
              product_category_id: 1,
              imageurl: "",
            }),
          }
        );
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe(name);
        productTest = data;
      });

      it("create product2", async () => {
        const name = Math.random().toString(36).substring(2, 15);
        const response = await fetch(
          "http://localhost:3000/api/product/createProduct",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name,
              price: 30,
              stock: 100,
              description: name + " description",
              product_category_id: 1,
              imageurl: "https://example.com/photo.jpg",
            }),
          }
        );
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.name).toBe(name);
        productTest2 = data;
      });
  
    it("get all carts", async () => {
        const response = await fetch(`http://localhost:3000/api/cart/getCart/${userTest?.user_id}`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
    })

    it("add to cart", async () => {
        const response = await fetch("http://localhost:3000/api/cart/addToCart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userTest?.user_id, product_id: productTest.id, quantity: 1 }),
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toHaveProperty("user_id");
        expect(data).toHaveProperty("product_id");
        expect(data).toHaveProperty("quantity");
    })

    it("update cart item", async () => {
        const response = await fetch("http://localhost:3000/api/cart/updateCartItem", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userTest?.user_id, product_id: productTest.id, quantity: 2 }),
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toMatchObject({
            user_id: userTest?.user_id,
            product_id: productTest.id,
            quantity: 2,
        });
    })

    it("update non-existent product_id in cart item", async () => {
        const response = await fetch("http://localhost:3000/api/cart/updateCartItem", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userTest?.user_id, product_id: 0, quantity: 2 }),
        });
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.error).toBe("Invalid product ID");
    })

    it("remove from cart", async () => {
        const response = await fetch("http://localhost:3000/api/cart/removeFromCart", {
            headers: { "Content-Type": "application/json" },
            method: "DELETE",
            body: JSON.stringify({ user_id: userTest?.user_id, product_id: productTest.id }),
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data).toMatchObject({
            user_id: userTest?.user_id,
            product_id: productTest.id,
        });
    })

    it("remove non-existent product_id in cart item", async () => {
        const response = await fetch("http://localhost:3000/api/cart/removeFromCart", {
            headers: { "Content-Type": "application/json" },
            method: "DELETE",
            body: JSON.stringify({ user_id: userTest?.user_id, product_id: productTest2.id }),
        });
        const data = await response.json();
        expect(response.status).toBe(404);
        expect(data.error).toBe("Cart not found");
    })  
    

    it("clear cart", async () => {
        const response = await fetch(`http://localhost:3000/api/cart/clearCart/${userTest?.user_id}`, {
            headers: { "Content-Type": "application/json" },
            method: "DELETE",
            body: JSON.stringify({ user_id: userTest?.user_id }),
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.count).toBeGreaterThanOrEqual(0);
    })

  afterAll(async () => {
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
})