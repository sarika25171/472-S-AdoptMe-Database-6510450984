import { emergency } from "@prisma/client";
import db from "./Database";

class EmergencyRepository {
  public async getAll(): Promise<Partial<emergency>[]> {
    return await db.emergency.findMany({
      select: { emergency_id: true, name: true, address: true, phone_number: true, latitude: true, longitude: true }
    });
  }

  public async getById(emergency_id: string): Promise<Partial<emergency> | null> {
    return await db.emergency.findUnique({
      where: { emergency_id },
      select: { emergency_id: true, name: true, address: true, phone_number: true, latitude: true, longitude: true }
    });
  }
}

export default EmergencyRepository;
