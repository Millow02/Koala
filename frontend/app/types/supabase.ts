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
        Relationships: [
          {
            foreignKeyName: "vehicle_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "Profile";
            referencedColumns: ["id"];
          }
        ];
      };

      Organization: {
        Row: {
          id: number;
          name: string;
          owner: number;
          created_at: string;
        };
        Insert: {
          id: number;
          name: string;
          owner: number;
          created_at: string;
        };
        Update: {
          id: number;
          name: string;
          owner: number;
          created_at: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_profile_id_fkey";
            columns: ["owner"];
            referencedRelation: "Profile";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "profile_org_id_fkey";
            columns: ["organizationId"];
            referencedRelation: "Organization";
            referencedColumns: ["id"];
          }
        ];
      };
      ParkingLot: {
        Row: {
          id: number; 
          name: string;
          description: string;
          address: string;
          organizationId: number;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
        Insert: {
          id: number; 
          name: string;
          description: string;
          address: string;
          organizationId: number;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
        Update: {
          id: number; 
          name: string;
          description: string;
          address: string;
          organizationId: number;
          capacity: string;
          current_occupancy: string;
          created_at: string; 
          picture: string;
        };
        Relationships: [
          {
            foreignKeyName: "lot_org_id_fkey";
            columns: ["organizationId"];
            referencedRelation: "Organization";
            referencedColumns: ["id"];
          }
        ];
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
    Relationships: [
      {
        foreignKeyName: "codes_org_id_fkey";
        columns: ["organization_id"];
        referencedRelation: "Organization";
        referencedColumns: ["id"];
      }
    ];
  };

    Membership: {
      Row: {
        id: number; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
      Insert: {
        id: number; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
      Update: {
        id: number; 
        parkingLotId: string;
        clientId: string;
        vehicle_id: number;
        status: string;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: "membership_parkingLotId_fkey";
          columns: ["parkingLotId"];
          referencedRelation: "ParkingLot";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "membership_clientId_fkey";
          columns: ["clientId"];
          referencedRelation: "Profile";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "membership_vehicle_id_fkey";
          columns: ["vehicle_id"];
          referencedRelation: "Vehicle";
          referencedColumns: ["id"];
        }
      ];
    };

    notifications: {
      Row: {
        id: number;
        user_id: number;
        content: string;
        type: string;
        is_read: boolean;
        action_url: string;
        created_at?: string;
      };
      Insert: {
        id: number;
        user_id: number;
        content: string;
        type: string;
        is_read: boolean;
        action_url: string;
        created_at?: string;
      }; 
      Update: {
        id: number;
        user_id: number;
        content: string;
        type: string;
        is_read: boolean;
        action_url: string;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: "notification_profile_id_fk";
          columns: ["user_id"];
          referencedRelation: "Profile";
          referencedColumns: ["id"];
        }
      ];
    }
  };
};
};
  



