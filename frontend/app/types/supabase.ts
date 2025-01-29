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
          created_at: string; 
        };
        Insert: {
          id: string; 
          first_name: string;
          last_name: string;
          email: string;
          created_at?: string; 
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          created_at?: string;
        };
      };
      Lots: {
        Row: {
          id: string; 
          organization: string;
          name: string;
          capacity: string;
          current_occupation: string;
          created_at: string; 
        };
        Insert: {
          id: string; 
          organization: string;
          name: string;
          capacity: string;
          current_occupation: string;
          created_at: string; 
        };
        Update: {
          id: string; 
          organization: string;
          name: string;
          capacity: string;
          current_occupation: string;
          created_at: string; 
        };
      };
    };
    Views: {};
    Functions: {};
  };
};
