CREATE OR REPLACE FUNCTION set_vehicle_owner_name()
RETURNS TRIGGER AS $$
DECLARE
  owner_name TEXT;
BEGIN
  IF NEW."vehicleId" IS NOT NULL THEN
    SELECT 
      CONCAT(p."first_name", ' ', p."last_name") INTO owner_name
    FROM 
      "Vehicle" v
      JOIN "Profile" p ON v."profile_id" = p.id
    WHERE 
      v.id = NEW."vehicleId";
    
    IF owner_name IS NOT NULL THEN
      UPDATE "Occupancy"
      SET "vehicleOwner" = owner_name
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that will run after insert
CREATE TRIGGER set_vehicle_owner_after_insert
AFTER INSERT ON "Occupancy"
FOR EACH ROW
EXECUTE FUNCTION set_vehicle_owner_name();