export type Database = {
  public: {
    Tables: {
      Profile: {
        Row: {
          id: string; 
          first_name: string;
          last_name: string;
          created_at: string; 
        };
        Insert: {
          id: string; 
          first_name: string;
          last_name: string;
          created_at?: string; 
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          created_at?: string;
        };
      };
      ParkingLot: {
        Row: {
          id: string; 
          name: string;
          description: string;
          created_at: string; 
        };
        Insert: {
          id: string; 
          name: string;
          description: string;
          created_at?: string; 
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
  };
};
