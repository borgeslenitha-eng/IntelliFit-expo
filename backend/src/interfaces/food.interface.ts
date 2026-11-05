export interface Food {
    id: number;
    userId: number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    storageLocation: string;
    expirationDate: Date;
    createdAt: Date;
}