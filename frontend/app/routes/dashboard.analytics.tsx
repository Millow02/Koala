import {useEffect, useState} from "react";
import { useParams, Link, useOutletContext } from "@remix-run/react";
import { Chart, Doughnut, Bar, Line } from 'react-chartjs-2';
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { ArrowPathIcon, ChevronDownIcon, BuildingOffice2Icon, BellIcon, CalendarIcon, ChevronRightIcon} from "@heroicons/react/24/outline";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
} from 'chart.js';

// Update your registration
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
);

type ContextType = {
  user: User;
  supabase: SupabaseClient;
};

export default function Analytics() {
  const { user, supabase } = useOutletContext<ContextType>();
  
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [previousWeeks, setPreviousWeeks] = useState<Date[]>([]);
  const [parkingLotId, setParkingLotId] = useState<string>("");
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expectedOccupancyData, setExpectedOccupancyData] = useState<any>(null);
  const [isExpectedLoading, setIsExpectedLoading] = useState(true);
  const [membershipData, setMembershipData] = useState<any>(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [totalCapacity, setTotalCapacity] = useState(0);

  useEffect(() => {
    const fetchUserOrganization = async () => {
      if (!supabase || !user) return;
      
      try {
        // Get the user's organization
        const { data, error } = await supabase
          .from("Profile")
          .select("organizationId")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user organization:", error);
          return;
        }
        
        if (data?.organizationId) {
          setOrganizationId(data.organizationId);
          //console.log("User belongs to organization:", data.organizationId);
        }
      } catch (err) {
        console.error("Unexpected error fetching user organization:", err);
      }
    };
    
    fetchUserOrganization();
  }, [supabase, user]);

  const processOccupancyData = (data: any[], weekStart: Date) => {
    // Initialize array for the 7 days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyCounts = Array(7).fill(0);
    
    // Count vehicles that entered on each day
    data.forEach(record => {
      const entryDate = new Date(record.entryTime);
      const dayIndex = entryDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      dailyCounts[dayIndex]++;
    });
    
    return {
      labels: days,
      counts: dailyCounts
    };
  };

    
    
  const fetchWeeklyOccupancy = async (weekStartDate: Date) => {
    if (!supabase || !organizationId) return;
    
    setIsLoading(true);
    
    try {
      // Use the selected week date
      const startDate = new Date(weekStartDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      // Convert dates to ISO strings for Supabase query
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      // First get the parking lots for this organization
      const { data: orgParkingLots, error: parkingLotError } = await supabase
        .from("ParkingLot")
        .select("id")
        .eq("organizationId", organizationId);
      
      if (parkingLotError) {
        console.error("Error fetching organization parking lots:", parkingLotError);
        setIsLoading(false);
        return;
      }
      
      // Extract parking lot IDs
      const parkingLotIds = orgParkingLots.map(lot => lot.id);
      
      if (parkingLotIds.length === 0) {
        console.log("No parking lots found for this organization");
        setWeeklyData({ labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], counts: [0, 0, 0, 0, 0, 0, 0] });
        setIsLoading(false);
        return;
      }
      
      // Query Occupancy table directly, filtering by facilityId
      let query = supabase
        .from("Occupancy")
        .select("entryTime, facilityId")
        .in("facilityId", parkingLotIds)
        .gte("entryTime", startIso)
        .lte("entryTime", endIso);
      
      // Apply specific facility filter if selected
      if (parkingLotId && parkingLotId !== "") {
        query = query.eq("facilityId", parkingLotId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching weekly occupancy data:", error);
        setIsLoading(false);
        return;
      }
      
      //console.log(`Found ${data?.length || 0} occupancy events for the selected week`);
      
      // Process the data for the chart
      const dailyCounts = processOccupancyData(data || [], startDate);
      setWeeklyData(dailyCounts);
      
    } catch (err) {
      console.error("Unexpected error fetching weekly data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchWeeklyOccupancy(selectedWeek),
      fetchExpectedOccupancy(),
      fetchMembershipGrowth(),
      fetchDashboardStats()
    ]);
    setIsRefreshing(false);
  };

  // Initial setup - run once
  useEffect(() => {
    // Generate the last 4 weeks for the dropdown
    const today = new Date();
    const weeks: Date[] = [];
    
    // Start with the beginning of the current week (Sunday)
    const currentWeek = new Date(today);
    currentWeek.setDate(today.getDate() - today.getDay()); // Move to Sunday
    
    // Add the current week
    weeks.push(new Date(currentWeek));
    
    // Add the previous 4 weeks
    for (let i = 1; i <= 4; i++) {
      const prevWeek = new Date(currentWeek);
      prevWeek.setDate(prevWeek.getDate() - (7 * i));
      weeks.push(new Date(prevWeek));
    }
    
    setPreviousWeeks(weeks);
    setSelectedWeek(weeks[0]); // Select current week by default
    
    // Fetch parking lots
    const fetchParkingLots = async () => {
      try {
        const { data, error } = await supabase
          .from("ParkingLot")
          .select("id, name")
          .eq("organizationId", organizationId);
          
        if (error) {
          console.error("Error fetching parking lots:", error);
          return;
        }
        
        setParkingLots(data || []);
      } catch (err) {
        console.error("Unexpected error fetching parking lots:", err);
      }
    };
    
    if (organizationId) {
      fetchParkingLots();
      fetchDashboardStats();
    }
  }, [supabase, organizationId]);

  // Fetch data when selectedWeek or parkingLotId changes
  useEffect(() => {
    if (selectedWeek && supabase && organizationId) {
      fetchWeeklyOccupancy(selectedWeek);
    }
  }, [selectedWeek, parkingLotId, supabase, organizationId]);

  const renderWeeklyChart = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-80 text-gray-400">Loading data...</div>;
    }
    
    if (!weeklyData || !weeklyData.labels || weeklyData.counts.every((count: number) => count === 0)) {
      return <div className="flex justify-center items-center h-80 text-gray-400">No data available for this week</div>;
    }
    
    const chartData = {
      labels: weeklyData.labels,
      datasets: [
        {
          label: 'Vehicles',
          data: weeklyData.counts,
          backgroundColor: '#EC4899',
          borderColor: '#BE185D',
          borderWidth: 1,
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 20,
          ticks: {
            color: 'white',
            stepSize: 1,  // Force a step size of 1
            callback: function(value: number) {  // Format tick values
              if (Math.floor(value) === value) {
                return value;
              }
              return null;  // Hide non-integer values
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          }
        },
        x: {
          ticks: {
            color: 'white',
            font: {
              size: 12
            }
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
          labels: {
            color: 'white',
          }
        },
        title: {
          display: false,
          text: `Occupancy: Week of ${selectedWeek.toLocaleDateString()}`,
          color: 'white',
          font: {
            size: 16
          }
        }
      }
    };
    
    return (
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  
  // Add this function to fetch expected occupancy
  const fetchExpectedOccupancy = async () => {
    if (!supabase || !organizationId) return;
    
    setIsExpectedLoading(true);
    
    try {
      // Calculate 4 weeks ago for the historical analysis
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      // First get the parking lots for this organization
      const { data: orgParkingLots, error: parkingLotError } = await supabase
        .from("ParkingLot")
        .select("id")
        .eq("organizationId", organizationId);
      
      if (parkingLotError) {
        console.error("Error fetching organization parking lots:", parkingLotError);
        setIsExpectedLoading(false);
        return;
      }
      
      // Extract parking lot IDs
      const parkingLotIds = orgParkingLots.map(lot => lot.id);
      
      if (parkingLotIds.length === 0) {
        console.log("No parking lots found for this organization");
        setExpectedOccupancyData({ labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], counts: [0, 0, 0, 0, 0, 0, 0] });
        setIsExpectedLoading(false);
        return;
      }
      
      // Query Occupancy table directly, filtering by facilityId
      let query = supabase
        .from("Occupancy")
        .select("entryTime, facilityId")
        .in("facilityId", parkingLotIds)
        .gte("entryTime", fourWeeksAgo.toISOString());
      
      // Apply specific facility filter if selected
      if (parkingLotId && parkingLotId !== "") {
        query = query.eq("facilityId", parkingLotId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching expected occupancy data:", error);
        setIsExpectedLoading(false);
        return;
      }
      
      //console.log(`Received ${data?.length || 0} records for expected occupancy chart`);
      
      // Process the data to get averages per day of week
      const avgByDay = processExpectedOccupancy(data || []);
      setExpectedOccupancyData(avgByDay);
      
    } catch (err) {
      console.error("Unexpected error fetching expected occupancy data:", err);
    } finally {
      setIsExpectedLoading(false);
    }
  };
  
  // Process data to get expected occupancy
  const processExpectedOccupancy = (data: any[]) => {
    console.log('Expected occupancy data being processed:', data.length, 'records');
    
    // Initialize array for the 7 days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create counters for each day and week
    // Using a number array to count entries per week instead of a Set
    const weekCounts: { [key: number]: number[] } = {
      0: [0, 0, 0, 0], // Initialize counts for each of the 4 weeks
      1: [0, 0, 0, 0],
      2: [0, 0, 0, 0],
      3: [0, 0, 0, 0],
      4: [0, 0, 0, 0],
      5: [0, 0, 0, 0],
      6: [0, 0, 0, 0]
    };
    
    // Create arrays to group entries by day of week
    const dailyEntries: { [key: number]: number[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    
    // Group entries by day of week
    data.forEach(record => {
      const entryDate = new Date(record.entryTime);
      const dayIndex = entryDate.getDay();
      
      // Add this entry to the appropriate day's array
      if (!dailyEntries[dayIndex]) {
        dailyEntries[dayIndex] = [];
      }
      
      dailyEntries[dayIndex].push(entryDate.getTime());
    });
  
    // Log initial grouping
    console.log('Initial grouping by day of week:');
    days.forEach((day, i) => {
      console.log(`${day}: ${dailyEntries[i].length} total entries`);
      if (day === 'Sun') {
        // Convert timestamps to readable date format for Sunday entries
        const formattedDates = dailyEntries[i].map(timestamp => {
          const date = new Date(timestamp);
          return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        });
        console.log(`  All entries for ${day}:`);
        formattedDates.forEach((date, index) => {
          console.log(`    ${index+1}. ${date}`);
        });
      }
    });
    
    // Calculate the start of each of the past 4 weeks
    const now = new Date();
    const weekStarts: Date[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      weekStarts.push(weekStart);
    }
    
    console.log('Week start dates:');
    weekStarts.forEach((date, i) => {
      console.log(`Week ${i+1}: ${date.toISOString()} to ${new Date(date.getTime() + 7*24*60*60*1000).toISOString()}`);
    });
  
    // Assign entries to weeks and count them
    Object.entries(dailyEntries).forEach(([dayIdxStr, entries]) => {
      const dayIdx = parseInt(dayIdxStr);
      
      console.log(`Processing ${entries.length} entries for ${days[dayIdx]}`);
    
      entries.forEach(timestamp => {
        const date = new Date(timestamp);
        
        // Find which week this date belongs to
        let foundWeek = false;
        for (let weekIdx = 0; weekIdx < weekStarts.length; weekIdx++) {
          const weekStart = weekStarts[weekIdx];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          
          if (date >= weekStart && date < weekEnd) {
            // Increment the counter for this day and week
            weekCounts[dayIdx][weekIdx]++;
            foundWeek = true;
            
            // Only log Sunday entries
            if (date.getDay() === 0) {
              console.log(`  ✅ Entry fits in week ${weekIdx+1}! Count now: ${weekCounts[dayIdx][weekIdx]}`);
            }
            break;
          }
        }
        
        if (!foundWeek) {
          // Only log errors for Sunday entries
          if (date.getDay() === 0) {
            console.log(`❌ Entry from date ${date.toISOString()} (Sunday) didn't fit in any week`);
            console.log(`  Available weeks:`, weekStarts.map(ws => `${ws.toISOString()} (${ws.getTime()})`));
          }
        }
      });
    });
  
    // Log the counts after processing
    console.log('Week counts after processing:');
    days.forEach((day, dayIdx) => {
      console.log(`${day}:`);
      weekStarts.forEach((_, weekIdx) => {
        console.log(`  Week ${weekIdx+1}: ${weekCounts[dayIdx][weekIdx]} entries`);
      });
    });
    
    // Calculate average entries per day - this is the main change from before
    const averages = days.map((day, index) => {
      // Calculate how many of the past 4 weeks had this day
      let weeksWithData = 0;
      let totalEntries = 0;
      
      for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
        if (weekCounts[index][weekIdx] > 0) {
          weeksWithData++;
          totalEntries += weekCounts[index][weekIdx];
        }
      }
      
      console.log(`${day}: ${totalEntries} total entries across ${weeksWithData} weeks`);
  
      // Calculate the average - if there are no weeks with data, return 0
      if (weeksWithData === 0) return 0;
      
      // Calculate average events per day - this gives you what you want
      const average = totalEntries / weeksWithData;
      console.log(`${day}: Average = ${totalEntries} / ${weeksWithData} = ${average}`);
      return average;
    });
  
    // Log the final results
    console.log('Processed expected occupancy data:', {
      days,
      averages,
      totalRecords: data.length
    });
  
    // Round the averages to 1 decimal place for display
    const roundedAverages = averages.map(avg => Math.round(avg * 10) / 10);
  
    return {
      labels: days,
      counts: roundedAverages
    };
  };
  
  // Add this effect to fetch the expected occupancy
  useEffect(() => {
    if (supabase && organizationId) {
      fetchExpectedOccupancy();
    }
  }, [parkingLotId, supabase, organizationId]);
  
  // Add this function to render the expected occupancy chart
  const renderExpectedOccupancyChart = () => {
    if (isExpectedLoading) {
      return <div className="flex justify-center items-center h-80 text-gray-400">Loading data...</div>;
    }
    
    if (!expectedOccupancyData || !expectedOccupancyData.labels || expectedOccupancyData.counts.every((count: number) => count === 0)) {
      return <div className="flex justify-center items-center h-80 text-gray-400">No historical data available</div>;
    }
    
    const chartData = {
      labels: expectedOccupancyData.labels,
      datasets: [
        {
          label: 'Expected Events',
          data: expectedOccupancyData.counts,
          backgroundColor: '#10B981', // Green color to differentiate from the first chart
          borderColor: '#059669',
          borderWidth: 1,
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 20,
          ticks: {
            color: 'white',
            stepSize: 1,
            callback: function(value: number) {
              if (Math.floor(value) === value) {
                return value;
              }
              return null;
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          }
        },
        x: {
          ticks: {
            color: 'white',
            font: {
              size: 12
            }
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
          labels: {
            color: 'white',
          }
        },
        title: {
          display: false,
          text: 'Expected Occupancy by Day',
          color: 'white',
          font: {
            size: 16
          }
        }
      }
    };
    
    return (
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    );
  };
  
  const fetchMembershipGrowth = async () => {
    if (!supabase) return;
    
    setIsMembershipLoading(true);
    
    try {
      // Use February 9, 2025 as the start date
      const startDate = new Date(2025, 1, 9); // Month is 0-indexed, so 1 = February
      
      //console.log(`Fetching membership data since ${startDate.toLocaleDateString()}`);
      
      // Build query for membership growth
      const { data, error } = await supabase
        .from("Membership")
        .select("created_at, ParkingLot!inner(id, organizationId)")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching membership data:", error);
        return;
      }
      
      //console.log("Membership data received:", data?.length || 0, "users");
      
      // Process the data to show growth
      const processedData = processMembershipData(data || [], startDate);
      setMembershipData(processedData);
      
    } catch (err) {
      console.error("Unexpected error fetching membership data:", err);
    } finally {
      setIsMembershipLoading(false);
    }
  };

  const processMembershipData = (data: any[], startDate: Date) => {
    // Get the weeks from start date to now
    const weeks: Date[] = [];
    const now = new Date();
    
    // Start with the beginning of the specified week
    const firstWeekStart = new Date(startDate);
    firstWeekStart.setDate(startDate.getDate() - startDate.getDay()); // Move to Sunday
    firstWeekStart.setHours(0, 0, 0, 0);
    
    let currentWeek = new Date(firstWeekStart);
    
    // Generate weekly points until current date
    while (currentWeek <= now) {
      weeks.push(new Date(currentWeek));
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    // Format week labels
    const labels = weeks.map(week => {
      return `${week.getMonth() + 1}/${week.getDate()}`;
    });
    
    // Sort users by creation date
    const sortedData = [...data].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    // Calculate cumulative users per week
    const cumulativeCounts = Array(weeks.length).fill(0);
    let totalUsers = 0;
    
    sortedData.forEach(user => {
      const creationDate = new Date(user.created_at);
      
      // Find which week this user joined
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = weeks[i];
        const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : new Date(now);
        weekEnd.setHours(23, 59, 59, 999);
        
        if (creationDate >= weekStart && creationDate < weekEnd) {
          totalUsers++;
          cumulativeCounts[i] = totalUsers;
          
          // Fill the remaining weeks with this count
          for (let j = i + 1; j < weeks.length; j++) {
            cumulativeCounts[j] = totalUsers;
          }
          
          break;
        }
      }
    });
    
    return {
      labels,
      counts: cumulativeCounts
    };
  };

  useEffect(() => {
    if (supabase && organizationId) {
      fetchMembershipGrowth();
    }
  }, [supabase, organizationId]);

  const renderMembershipChart = () => {
    if (isMembershipLoading) {
      return <div className="flex justify-center items-center h-80 text-gray-400">Loading data...</div>;
    }
    
    if (!membershipData || !membershipData.labels || membershipData.counts.every((count: number) => count === 0)) {
      return <div className="flex justify-center items-center h-80 text-gray-400">No membership data available</div>;
    }
    
    const chartData = {
      labels: membershipData.labels,
      datasets: [
        {
          label: 'Total Members',
          data: membershipData.counts,
          fill: false,
          backgroundColor: '#3B82F6',
          borderColor: '#60A5FA',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 20,
          ticks: {
            color: 'white',
            precision: 0
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          }
        },
               x: {
          ticks: {
            color: 'white',
            font: {
              size: 9  // Reduced from 10 to allow more space
            },
            maxRotation: 45,
            minRotation: 45,
            autoSkip: false,  // Don't automatically skip labels
            callback: function(value: number, index: number, ticks: any) {
              // Log to see what we're getting
              
              // If there are more than 8 labels, only show every other one
              if (ticks.length > 8) {
                return index % 2 === 0 ? value : '';
              }
              return this.getLabelForValue(value);
            }
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
          labels: {
            color: 'white',
          }
        },
        title: {
          display: false,
          text: 'Membership Growth',
          color: 'white',
          font: {
            size: 16
          }
        }
      }
    };
    
    return (
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    );
  };



    // Add these state variables
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalOccupancy: 0,
    totalCameras: 0,
    totalFacilities: 0,
    totalIntruders: 0,
    offlineCameras: 0
  });
  

  
  const fetchDashboardStats = async () => {
    if (!supabase || !organizationId) return;
    
    try {
      // Get member count
      const { count: memberCount, error: memberError } = await supabase
        .from("Membership")
        .select("id, ParkingLot!inner(id, organizationId)", { count: "exact" })
        .eq("ParkingLot.organizationId", organizationId);
      
      if (memberError) {
        console.error("Error fetching members:", memberError);
      }
      
      // Get camera count and their status
      const { data: cameras, error: cameraError } = await supabase
        .from("Camera")
        .select("id, status, ParkingLot!inner(organizationId)")
        .eq("ParkingLot.organizationId", organizationId);
      
      if (cameraError) {
        console.error("Error fetching cameras:", cameraError);
      }
      
      // Count offline cameras (those with status other than "Active")
      const offlineCamerasCount = cameras?.filter(camera => camera.status !== "Active").length || 0;
      
      // Get facilities count
      let totalCapacityValue = 0;
      const { data: facilities, error: facilityError } = await supabase
        .from("ParkingLot")
        .select("id, capacity")
        .eq("organizationId", organizationId);
      
      if (facilityError) {
        console.error("Error fetching facilities:", facilityError);
      } else if (facilities) {
        // Sum up the capacity of all facilities
        totalCapacityValue = facilities.reduce((sum, lot) => sum + (lot.capacity || 0), 0);
      }

      setTotalCapacity(totalCapacityValue);
      
      // Get current active occupancy from Occupancy table
      const facilityIds = facilities?.map(f => f.id) || [];
      
      let occupancyCount = 0;
      let intrudersCount = 0;
      if (facilityIds.length > 0) {
        // Query Occupancy table for active occupancies
        const { data, error: occupancyError } = await supabase
          .from("Occupancy")
          .select("id, isPermitted")
          .in("facilityId", facilityIds)
          .eq("Status", "Active");
        
        if (occupancyError) {
          console.error("Error fetching active occupancy count:", occupancyError);
        } else if (data) {
          // Count total occupancies manually from the data array
          occupancyCount = data.length;
          
          // Count intruders (where isPermitted is false)
          intrudersCount = data.filter(occ => occ.isPermitted === false).length;
        }
      }
      
      // Update stats state
      setStats({
        totalMembers: memberCount || 0,
        totalOccupancy: occupancyCount,
        totalCameras: cameras?.length || 0,
        totalFacilities: facilities?.length || 0,
        totalIntruders: intrudersCount,
        offlineCameras: offlineCamerasCount 
      });
      
    } catch (err) {
      console.error("Unexpected error fetching dashboard stats:", err);
    }
  };
  
  useEffect(() => {
    if (supabase && organizationId) {
      fetchDashboardStats();
    }
  }, [supabase, organizationId]);

  const renderOccupancyDoughnut = () => {

    // console.log("Chart rendering with stats:", {
    // statsTotal: stats.totalOccupancy,
    // capacity: totalCapacity,
    // availableCalc: Math.max(0, totalCapacity - stats.totalOccupancy)
    // });
  

    if (totalCapacity === 0 && stats.totalOccupancy === 0) {
      return <div className="flex justify-center items-center h-48 text-gray-400">Loading data...</div>;
    }
  
    // Calculate available capacity
    const availableCapacity = Math.max(0, totalCapacity - stats.totalOccupancy);
    const permittedVehicles = Math.max(0, stats.totalOccupancy - stats.totalIntruders);
    
    const chartData = {
      labels: ['Permitted Vehicles', 'Intruders', 'Available Capacity'],
      datasets: [
        {
          data: [permittedVehicles, stats.totalIntruders, availableCapacity],
          backgroundColor: [
            '#10B981', // Green for permitted vehicles
            '#EF4444', // Red for intruders
            '#6B7280'  // Gray for available capacity
          ],
          borderColor: [
            '#059669',
            '#B91C1C',
            '#4B5563'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: false,
          position: 'bottom' as const, // Changed from 'right' to 'bottom'
          labels: {
            color: 'white',
            padding: 10,
            usePointStyle: true,
            font: {
              size: 11
            },
            boxWidth: 8
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    // Center text plugin
    const textCenterOccupancy = {
      id: 'textCenterOccupancy',
      beforeDraw: function(chart: any) {
        const width = chart.width;
        const height = chart.height;
        const ctx = chart.ctx;
        
        ctx.restore();
        const fontSize = (height / 120).toFixed(2);
        ctx.font = `bold ${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        const dataValues = chart.data.datasets[0].data;
        const totalOccupied = dataValues[0] + dataValues[1]; // Permitted + Intruders
        const totalCapacity = totalOccupied + dataValues[2]; // + Available Capacity
        
        const text = `${totalOccupied}/${totalCapacity}`;
        const textX = width / 2;
        const textY = height / 2;
        
        ctx.fillStyle = 'white';
        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    };
    
    return (
      <div className="h-48">
        <Doughnut data={chartData} options={options} plugins={[textCenterOccupancy]} />
      </div>
    );
  };
  
  const renderCamerasDoughnut = () => {

    if (stats.totalCameras === 0) {
      return <div className="flex justify-center items-center h-48 text-gray-400">Loading data...</div>;
    }
  
    const onlineCameras = stats.totalCameras - stats.offlineCameras;
    
    const chartData = {
      labels: ['Online Cameras', 'Offline Cameras'],
      datasets: [
        {
          data: [onlineCameras, stats.offlineCameras],
          backgroundColor: [
            '#3B82F6', // Blue for online cameras
            '#9CA3AF'  // Gray for offline cameras
          ],
          borderColor: [
            '#2563EB',
            '#6B7280'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: false,
          position: 'bottom' as const, // Change from 'bottom' to 'right'
          labels: {
            color: 'white',
            padding: 10,
            usePointStyle: true, // Use point style for a cleaner look
            font: {
              size: 11
            },
            boxWidth: 8 // Make legend items more compact
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    // Center text plugin
    const textCenterCameras = {
      id: 'textCenterCameras',
      beforeDraw: function(chart: any) {
        const width = chart.width;
        const height = chart.height;
        const ctx = chart.ctx;
        
        ctx.restore();
        const fontSize = (height / 120).toFixed(2);
        ctx.font = `bold ${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        const text = `${onlineCameras}/${stats.totalCameras}`;
        const textX = width / 2;
        const textY = height / 2;
        
        ctx.fillStyle = 'white';
        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    };
    
    return (
      <div className="h-48">
        <Doughnut data={chartData} options={options} plugins={[textCenterCameras]} />
      </div>
    );
  };






  return (
    <div className="relative" style={{minWidth:"1200px"}}>
      <div className="w-full px-32" >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <div 
            className="ml-auto flex items-center text-gray-400 cursor-pointer p-1 rounded-lg hover:text-pink-400 hover:bg-gray-600 transition-colors"
            onClick={handleRefresh}
          >
            <span className="mr-1">Refresh</span>
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>
        </div>
        <hr className="border-pink-500 border-1 mt-6" />
      </div>
      
      <div className="flex flex-wrap justify-center mt-12 max-w-[2000px] mx-auto">
        <div className="pr-6" style={{width: "700px"}}>
          {/* Left side charts */}
          
          <div className="border-neutral-600 border-2 rounded-3xl mb-6" style={{ backgroundColor: "#333842", width: "100%", minWidth: "450px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold">Weekly Occupancy</h2>
              
              <div className="ml-auto flex items-center space-x-4">
                {/*Parking lot selector
                <div className="relative">
                  <select 
                    className="bg-slate-600 border-none rounded-lg py-2 px-4 text-white appearance-none pr-10 focus:outline-none focus:ring-1 focus:ring-white"
                    value={parkingLotId}
                    onChange={(e) => setParkingLotId(e.target.value)}
                  >
                    <option value="">All Facilities</option>
                    {parkingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                */}
                
                {/* Week selector */}
                <div className="relative">
                  <select 
                    className="bg-slate-600 border-none rounded-lg py-2 px-4 text-white appearance-none pr-10 focus:outline-none focus:ring-1 focus:ring-white"
                    value={selectedWeek.toISOString()}
                    onChange={(e) => {
                      setSelectedWeek(new Date(e.target.value));
                    }}
                  >
                    {previousWeeks.map((week, index) => (
                      <option 
                        key={week.toISOString()} 
                        value={week.toISOString()}
                      >
                        {index === 0 ? 'Current Week' : `Week of ${week.toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            
            <hr className="border-neutral-600 border-2" />
            
            <div className="p-6">
              {renderWeeklyChart()}
            </div>
          </div>
          
          <div className="border-neutral-600 border-2 rounded-3xl mb-6" style={{ backgroundColor: "#333842", width: "100%", minWidth: "450px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold">Expected Occupancy</h2>
              
              <div className="ml-auto flex items-center space-x-4">
                {/* Parking lot selector - reuse the same one as above 
                <div className="relative">
                  <select 
                    className="bg-slate-600 border-none rounded-lg py-2 px-4 text-white appearance-none pr-10 focus:outline-none focus:ring-1 focus:ring-white"
                    value={parkingLotId}
                    onChange={(e) => setParkingLotId(e.target.value)}
                  >
                    <option value="">All Facilities</option>
                    {parkingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-white" />
                  </div>
                </div>*/}
              </div>
            </div>
            
            <hr className="border-neutral-600 border-2" />
            
            <div className="p-6">
              {renderExpectedOccupancyChart()}
            </div>
          </div>
          
        </div>
        
        <div className="" style={{width: "500px"}}>
          {/* Right side charts */}
          
          <div className="border-neutral-600 border-2 rounded-3xl mb-6" style={{ backgroundColor: "#333842", width: "500px", minWidth: "500px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold" style={{paddingBottom: 4, paddingTop:4}}>Membership Growth</h2>
            </div>
            <hr className="border-neutral-600 border-2" />
            <div className="p-6">
              {renderMembershipChart()}
            </div>
          </div>
          
          <div className="border-neutral-600 border-2 rounded-3xl mb-6" style={{ backgroundColor: "#333842", width: "500px", minWidth: "500px" }}>
            <div className="flex items-center py-4 px-6 relative">
              <h2 className="text-2xl font-semibold">Current Status</h2>
            </div>
            
            <hr className="border-neutral-600 border-2" />
            
            <div className="p-6" style={{height: "368px"}}>
              {/* Create two distinct columns */}
              <div className="flex h-full">
                {/* Left column */}
                <div className="w-1/2 pr-4 flex flex-col justify-center">
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Total Members</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.totalMembers}</p>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Total Occupancy</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.totalOccupancy}</p>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Total Cameras</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.totalCameras}</p>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="w-1/2 pl-4 flex flex-col justify-center">
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Total Facilities</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.totalFacilities}</p>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Total Intruders</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.totalIntruders}</p>
                  </div>
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold">Offline Cameras</h3>
                    <p className="text-3xl font-bold text-pink-400">{stats.offlineCameras}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>


      </div>
        
      <div className="flex flex-wrap justify-center max-w-[2000px] mx-auto">


        <div className="border-neutral-600 border-2 rounded-3xl mb-6 mr-6" style={{ backgroundColor: "#333842", width: "350px", minWidth: "300px" }}>
          <div className="flex items-center py-4 px-6 relative">
            <h2 className="text-2xl font-semibold" style={{paddingBottom: 4, paddingTop:4}}>Links</h2>
          </div>
          <hr className="border-neutral-600 border-2" />
          <div className="">
            <ul className="">
            <li className="hover:bg-gray-500 py-4 px-2 border-b border-neutral-600">
              <Link 
                to="/dashboard/lots" 
                className="flex items-center text-lg text-white hover:text-pink-400 transition-colors group"
              >
                <BuildingOffice2Icon className="h-6 w-6 mr-3" />
                <span className="flex-grow">Parking Lots</span>
                <div className="h-7 w-7 rounded-full border border-gray-400 group-hover:border-pink-400 flex items-center justify-center">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </Link>
            </li>
              
              <li className="hover:bg-gray-500 py-4 px-2 border-b border-neutral-600">
                <Link 
                  to="/dashboard/records" 
                  className="flex items-center text-lg text-white hover:text-pink-400 transition-colors group"
                >
                  <CalendarIcon className="h-6 w-6 mr-3" />
                  <span className="flex-grow">Records</span>
                  <div className="h-7 w-7 rounded-full border border-gray-400 group-hover:border-pink-400 flex items-center justify-center">
                    <ChevronRightIcon className="h-4 w-4" />
                  </div>
                </Link>
              </li>
              <li className="hover:bg-gray-500 py-4 px-2 border-b border-neutral-600">
                <Link 
                  to="/dashboard/notifications" 
                  className="flex items-center text-lg text-white hover:text-pink-400 transition-colors group"
                >
                  <BellIcon className="h-6 w-6 mr-3" />
                  <span className="flex-grow">Notifications</span>
                  <div className="h-7 w-7 rounded-full border border-gray-400 group-hover:border-pink-400 flex items-center justify-center">
                    <ChevronRightIcon className="h-4 w-4" />
                  </div>
                </Link>
              </li>

            </ul>
          </div>
        </div>

        <div className="border-neutral-600 border-2 rounded-3xl mb-6" style={{ backgroundColor: "#333842", width: "825px", minWidth: "300px" }}>
          <div className="flex items-center py-4 px-6 relative">
            <h2 className="text-2xl font-semibold" style={{paddingBottom: 4, paddingTop:4}}>Detailed Current Status</h2>
          </div>
          <hr className="border-neutral-600 border-2" />
          <div className="p-6">
            <div className="flex flex-row gap-8">
              <div className="w-1/2">
                <h3 className="text-lg font-semibold mb-2 text-center">Occupancy</h3>
                {renderOccupancyDoughnut()}
              </div>
              
              <div className="w-1/2">
                <h3 className="text-lg font-semibold mb-2 text-center">Cameras</h3>
                {renderCamerasDoughnut()}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}