CREATE OR REPLACE FUNCTION process_occupancy_event()
RETURNS TRIGGER AS $$
DECLARE 
  parkingLot_id BIGINT;
  camera_position TEXT;
  matched_vehicle_id BIGINT;
  is_permitted BOOLEAN;
BEGIN
  IF NEW.status = 'Unprocessed' THEN
    -- First find camera details regardless of vehicle match
    SELECT c."parkingLotId", c.position INTO parkingLot_id, camera_position
    FROM "Camera" c
    WHERE c.id = NEW."cameraId";
    
    -- If vehicle exists in Vehicle table
    IF EXISTS (
      SELECT 1 FROM "Vehicle" v 
      WHERE v."license_plate_number" = NEW."license_plate"
    ) THEN
      -- Get the vehicleId
      SELECT v.id INTO matched_vehicle_id
      FROM "Vehicle" v
      WHERE v."license_plate_number" = NEW."license_plate";
      
      -- Check if there's a matching membership and set the permission status
      SELECT EXISTS (
        SELECT 1 
        FROM "Membership" m
        WHERE m."vehicle_id" = matched_vehicle_id
          AND m."parkingLotId" = parkingLot_id
          AND m.status = 'Accepted'
      ) INTO is_permitted;

      -- Update the OccupancyEvent record
      UPDATE "OccupancyEvent"
      SET "vehicleId" = matched_vehicle_id,
          status = CASE WHEN is_permitted THEN 'Processed' ELSE 'Attention-Required' END
      WHERE id = NEW.id;
    ELSE
      -- No matching vehicle - requires attention
      UPDATE "OccupancyEvent"
      SET status = 'Attention-Required'
      WHERE id = NEW.id;
    END IF;
    
    -- Handle Occupancy table operations after OccupancyEvent update is complete
    -- Camera is entry/entrance
    IF camera_position = 'entry' THEN
      -- If we found a vehicle
      IF matched_vehicle_id IS NOT NULL THEN
        -- Insert a new record in Occupancy table for known vehicle
        INSERT INTO "Occupancy" (
          "vehicleId", 
          "facilityId", 
          "entryTime", 
          "Status", 
          "isPermitted",
          "LicensePlate"
        ) VALUES (
          matched_vehicle_id,
          parkingLot_id,
          NEW."created_at",
          'Active',
          is_permitted,
          NEW."license_plate"
        );
      ELSE
        -- Insert a new record for unknown vehicle
        INSERT INTO "Occupancy" (
          "vehicleId",
          "facilityId",
          "entryTime",
          "Status",
          "isPermitted",
          "LicensePlate"
        ) VALUES (
          NULL, -- No vehicle ID since it's unknown
          parkingLot_id,
          NEW."created_at",
          'Active',
          FALSE, -- Not permitted since vehicle is unknown
          NEW."license_plate"
        );
      END IF;
    -- Camera is exit
    ELSIF camera_position = 'exit' THEN
      -- Only process exit for known vehicles
      UPDATE "Occupancy"
      SET "exitTime" = NEW."created_at",
          "Status" = 'Archive'
      WHERE "LicensePlate" = NEW."license_plate"
        AND "facilityId" = parkingLot_id
        AND "Status" = 'Active'
        AND "exitTime" IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;