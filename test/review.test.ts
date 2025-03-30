import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import OrderController from "../src/controllers/OrderController";
import UserController from "../src/controllers/UserController";
import { product_category, product, user, order } from "@prisma/client";
import ProductCategoryController from "../src/controllers/ProductCategoryController";
import ProductController from "../src/controllers/ProductController";


const app = new Elysia()
  .use(OrderController)
  .use(UserController)
  .use(ProductController)
  .use(ProductCategoryController);
const generateRandomString = () => Math.random().toString(36).substring(2, 15);

let server: any;
let testData = {
  productCategory: null as product_category | null,
  product: null as product | null,
  user: null as user | null,
  order: null as order | null
};

describe("Review API in order", () => {
     beforeAll(async () => {
       server = app.listen(3005);
       console.log(`Test server running on port ${3005}`);
     });
   
     // User tests
     describe("User Management", () => {
       it("should create a new user", async () => {
         const username = generateRandomString();
         const email = `${username}@example.com`;
         
         const response = await fetch(`http://localhost:3005/api/user/register`, {
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
         const userResponse = await fetch(`http://localhost:3005/api/user/getUserByUsernameForTest/`, {
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
         
         const response = await fetch(`http://localhost:3005/api/product-category/createProductCategory`, {
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
         
         const response = await fetch(`http://localhost:3005/api/product/createProduct`, {
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
         
         const response = await fetch(`http://localhost:3005/api/order/createOrder`, {
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
   
  
	it("get all order by product id", async () => {
	  const response = await fetch(`http://localhost:3005/api/order/getByProductId/${testData.product?.id}`);
	  const data = await response.json();

	  expect(response.status).toBe(200);
	  expect(Array.isArray(data)).toBe(true);
	});


    it("add comment success", async () =>{
        const response = await fetch("http://localhost:3005/api/order/addComment",{
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: testData.order?.id,
              rating: "3.0",
              comment: "medium",
            }),
          });
        const data = await response.json();
  
        expect(response.status).toBe(200);
        expect(data.rating).toBe("3.0");
    })

    it("add comment to invalid order", async () =>{
        const response = await fetch("http://localhost:3005/api/order/addComment",{
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 999,
              rating: "3.0",
              comment: "medium",
            }),
          });
        const data = await response.json();
  
        expect(response.status).toBe(404);
        expect(data.error).toBe("Order not found");
    })

    it("add comment success", async () =>{
        const response = await fetch("http://localhost:3005/api/order/addReplyAdmin",{
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: testData.order?.id,
              reply_admin: "thank you",
            }),
          });
        const data = await response.json();
  
        expect(response.status).toBe(200);
        expect(data.reply_admin).toBe("thank you");
    })
    it("add comment to invalid order", async () =>{
        const response = await fetch("http://localhost:3005/api/order/addReplyAdmin",{
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 999,
              reply_admin: "thank you",

            }),
          });
        const data = await response.json();
  
        expect(response.status).toBe(404);
        expect(data.error).toBe("Order not found");
    })
  afterAll(async () => {
    // Only attempt to delete if the entity was created
    try {
      if (testData.order) {
        await fetch(`http://localhost:3005/api/order/deleteOrder`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.order.id }),
        });
        console.log(`Test order ${testData.order.id} deleted`);
      }
      
      if (testData.product) {
        await fetch(`http://localhost:3005/api/product/deleteProduct`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.product.id }),
        });
        console.log(`Test product ${testData.product.id} deleted`);
      }
      
      if (testData.productCategory) {
        await fetch(`http://localhost:3005/api/product-category/deleteProductCategory`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: testData.productCategory.id }),
        });
        console.log(`Test product category ${testData.productCategory.id} deleted`);
      }
      
      if (testData.user) {
        await fetch(`http://localhost:3005/api/user/delete`, {
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
    
  })
})