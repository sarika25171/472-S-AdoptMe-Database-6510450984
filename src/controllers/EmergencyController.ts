import { Elysia, t } from "elysia";
import EmergencyRepository from "../repositories/EmergencyRepository";

const EmergencyController = new Elysia({ prefix: "/api/emergency", tags: ["Emergency"] });

EmergencyController.get("/getAllEmergencies", async () => {
  const emergencyRepository = new EmergencyRepository();
  const emergencies = await emergencyRepository.getAllEmergencies();
  return emergencies ?? { error: "No emergency locations found" };
}, {
  detail: { summary: "Get all emergency locations", description: "Retrieve all emergency locations" }
});

EmergencyController.get(
    "/getById",
    async ({ body: { emergency_id } }) => {
        const emergencyRepository = new EmergencyRepository();
        const emergency = await emergencyRepository.getById(emergency_id);
        return emergency ?? { error: "Emergency location not found" };
}, 
{
  body: t.Object({ emergency_id: t.String() }),
  detail: { 
    summary: "Get emergency by ID", 
    description: "Retrieve a specific emergency location by ID" }
});

export default EmergencyController;