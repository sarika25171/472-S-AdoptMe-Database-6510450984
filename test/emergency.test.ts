import Elysia from "elysia";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import EmergencyController from "../src/controllers/EmergencyController";
import { emergency } from "@prisma/client";
import EmergencyRepository from "../src/repositories/EmergencyRepository";

const app = new Elysia().use(EmergencyController);
const server = app.listen(3006);
let emergency_id: string;

// Function to generate random coordinates within Thailand
function generateRandomCoordinates() {
  const thailandBounds = {
    minLat: 5.613,    // Southernmost point
    maxLat: 20.465,   // Northernmost point
    minLng: 97.345,   // Westernmost point
    maxLng: 105.639   // Easternmost point
  };
  
  // Generate random values within Thailand's bounds
  const latitude = thailandBounds.minLat + (Math.random() * (thailandBounds.maxLat - thailandBounds.minLat));
  const longitude = thailandBounds.minLng + (Math.random() * (thailandBounds.maxLng - thailandBounds.minLng));
  
  // Round to 6 decimal places (approx. 0.1 meter precision)
  return {
    latitude: Math.round(latitude * 1000000) / 1000000,
    longitude: Math.round(longitude * 1000000) / 1000000
  };
}

describe("Emergency API", () => {
  // Test for existing implementation
  it("get all emergencies", async () => {
    const response = await fetch("http://localhost:3006/api/emergency/getAllEmergencies");
    const data = await response.json();

    expect(response.status).toBe(200);
    // If data is an array, it passes the test
    // If data is an object with error property, it means no emergencies found, which is also valid
    expect(Array.isArray(data) || data.error).toBeTruthy();
  });

  // Tests for methods that need to be implemented
  describe("Methods to be implemented (based on Jira tickets)", () => {
    it.todo("create a new emergency location");
    it.todo("update an emergency location");
    it.todo("delete an emergency location");
  });

  afterAll(() => {
    server.stop(); // Stop the test server
  });
});