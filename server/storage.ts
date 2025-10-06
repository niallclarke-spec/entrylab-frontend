import { type User, type InsertUser, type Broker } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getBrokers(): Promise<Broker[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private brokers: Broker[];

  constructor() {
    this.users = new Map();
    this.brokers = [
      {
        id: "1",
        name: "GatesFX",
        logo: "https://placehold.co/200x200/3b82f6/ffffff?text=GatesFX",
        verified: true,
        pros: ["Scalping friendly", "Low spreads", "1:1000 Leverage"],
        link: "https://secure.gatesfx.com/links/go/427",
      },
      {
        id: "2",
        name: "HeroFX",
        logo: "https://placehold.co/200x200/10b981/ffffff?text=HeroFX",
        verified: true,
        pros: ["1:500 Leverage", "Crypto Deposits", "TradeLocker Platform"],
        link: "https://herofx.co/?partner_code=7167829",
      },
    ];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBrokers(): Promise<Broker[]> {
    return this.brokers;
  }
}

export const storage = new MemStorage();
