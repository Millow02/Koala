export type Database = {
  public: {
    Tables: {
      Vehicle: {
        Row: {
          id: string;
          profile_id: string;
          license_plate_number: string;
          name: string;
          model: string;
          colour: string;
          created_at: string;
        };
        Insert: {
          id: string;
          profile_id: string;
          license_plate_number: string;
          name: string;
          model: string;
          colour: string;
          created_at: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          license_plate_number?: string;
          name?: string;
          model?: string;
          colour?: string;
          created_at?: string;
        };
      };

      Organization: {
        Row: {
          id: string;
          name: string;
          owner: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          owner: string;
          created_at: string;
        };
        Update: {
          id: string;
          name: string;
          owner: string;
          created_at: string;
        };
      };

      Profile: {
        Row: {
          id: string; 
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string;
          role: string;
          organizationId: number;
          created_at: string; 
        };
        Insert: {
          id: string; 
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string;
          role: string;
          organizationId: number;
          created_at?: string; 
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone_number: string;
          role: string;
          organizationId: number;
          created_at?: string;
        };
      };
      ParkingLot: {
        Row: {
          id: number; 
          name: string;
          description: string;
          address: string;
          organizationId: string;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
        Insert: {
          id: string; 
          name: string;
          description: string;
          address: string;
          organizationId: string;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
        Update: {
          id: string; 
          name: string;
          description: string;
          address: string;
          organizationId: string;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
      };
    };
    Views: {};
    Functions: {};
  };

  organization_codes: {
    Row: {
      id: string; 
      organization_id: string;
      code: string;
      expires_at: string;
      is_expired: boolean;
      is_used: boolean;
      created_at?: string;
    };
    Insert: {
      id: string; 
      organization_id: string;
      code: string;
      expires_at: string;
      is_expired: boolean;
      is_used: boolean;
      created_at?: string;
    };
    Update: {
      id: string; 
      organization_id: string;
      code: string;
      expires_at: string;
      is_expired: boolean;     
      is_used: boolean;
      created_at?: string;
    };

    Membership: {
      Row: {
        id: string; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
      Insert: {
        id: string; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
      Update: {
        id: string; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
    };
  };
  
};


