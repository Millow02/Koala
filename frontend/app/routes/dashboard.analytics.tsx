import {useEffect, useState} from "react";
import { useParams, Link, useOutletContext } from "@remix-run/react";
import { Chart, Doughnut, Bar } from 'react-chartjs-2';
import { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { ArrowPathIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

// Update your registration
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
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

  const processOccupancyData = (data: any[], weekStart: Date) => {
    // Initialize array for the 7 days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyCounts = Array(7).fill(0);
    
    // Count vehicles that entered on each day
    data.forEach(record => {
      const entryDate = new Date(record.created_at);
      const dayIndex = entryDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      dailyCounts[dayIndex]++;
    });
    
    return {
      labels: days,
      counts: dailyCounts
    };
  };

    // Update your fetchWeeklyOccupancy function
  const fetchWeeklyOccupancy = async (weekStartDate: Date) => {
    if (!supabase) return;
    
    setIsLoading(true);
    
    // Calculate start and end dates for the week
    const startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    try {
      // Convert dates to ISO strings for Supabase query
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      // Build query based on whether a specific parking lot is selected
      let query = supabase
        .from("OccupancyEvent")
        .select("created_at")  // This is correct, keep using created_at
        .gte("created_at", startIso)  // Using created_at instead of entryTime
        .lte("created_at", endIso);  // Using created_at instead of entryTime
      
      // Add facility filter if a specific lot is selected
      if (parkingLotId) {
        // Check the correct field name for the parking lot ID in your database
        query = query.eq("cameraId", parkingLotId);  // Or this might be parkingLotId, facilityId, etc.
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching weekly occupancy data:", error);
        return;
      }
      
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
      fetchExpectedOccupancy()
    ]);
    setIsRefreshing(false);
  };

  // Initial setup - run once
  useEffect(() => {
    // Generate the last 4 weeks for the dropdown
    const today = new Date();
    const weeks = [];
    
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
          .select("id, name");
          
        if (error) {
          console.error("Error fetching parking lots:", error);
          return;
        }
        
        setParkingLots(data || []);
      } catch (err) {
        console.error("Unexpected error fetching parking lots:", err);
      }
    };
    
    fetchParkingLots();
  }, [supabase]); // Only depends on supabase

  // Fetch data when selectedWeek or parkingLotId changes
  useEffect(() => {
    if (selectedWeek && supabase) {
      fetchWeeklyOccupancy(selectedWeek);
    }
  }, [selectedWeek, parkingLotId, supabase]);

  const renderWeeklyChart = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64 text-gray-400">Loading data...</div>;
    }
    
    if (!weeklyData || !weeklyData.labels || weeklyData.counts.every((count: number) => count === 0)) {
      return <div className="flex justify-center items-center h-64 text-gray-400">No data available for this week</div>;
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
    if (!supabase) return;
    
    setIsExpectedLoading(true);
    
    try {
      // Calculate 4 weeks ago for the historical analysis
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      // Build query for historical data
      let query = supabase
        .from("OccupancyEvent")
        .select("created_at")
        .gte("created_at", fourWeeksAgo.toISOString());
      
      // Add facility filter if a specific lot is selected
      if (parkingLotId) {
        query = query.eq("cameraId", parkingLotId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching expected occupancy data:", error);
        return;
      }
      
      console.log(`Received ${data?.length || 0} records for expected occupancy chart`);


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
    console.log('Expected occupancy data being processed:', data);
    // Initialize array for the 7 days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create counters for each day
    const dailyEntries: { [key: number]: number[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    
    // Group entries by day of week
    data.forEach(record => {
      const entryDate = new Date(record.created_at);
      const dayIndex = entryDate.getDay();
      
      // Add this entry to the appropriate day's array
      if (!dailyEntries[dayIndex]) {
        dailyEntries[dayIndex] = [];
      }
      
      dailyEntries[dayIndex].push(entryDate.getTime());
    });
  
    // Group by week for each day
    const weekCounts: { [key: number]: Set<string>[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    
    // Initialize the week sets for each day (for the past 4 weeks)
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
        weekCounts[dayIdx][weekIdx] = new Set<string>();
      }
    }
    
    // Calculate the start of each of the past 4 weeks
    const now = new Date();
    const weekStarts: Date[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      weekStarts.push(weekStart);
    }
    
    // Assign entries to the appropriate week
    Object.entries(dailyEntries).forEach(([dayIdxStr, entries]) => {
      const dayIdx = parseInt(dayIdxStr);
      
      entries.forEach(dateStr => {
        const date = new Date(dateStr);
        
        // Find which week this date belongs to
        for (let weekIdx = 0; weekIdx < weekStarts.length; weekIdx++) {
          const weekStart = weekStarts[weekIdx];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          
          if (date >= weekStart && date < weekEnd) {
            // Add to the set of dates for this day and week
            // We use an ISO string of the date without time to count each day only once
            const dayKey = date.toISOString().split('T')[0];
            weekCounts[dayIdx][weekIdx].add(dayKey);
            break;
          }
        }
      });
    });
  
    Object.entries(dailyEntries).forEach(([dayIndex, entries]) => {
      console.log(`Day ${days[parseInt(dayIndex)]}: ${entries.length} total entries`);
    });
    
    // Calculate average entries per day
    const averages = days.map((day, index) => {
      // Calculate how many of the past 4 weeks had this day
      let weeksWithData = 0;
      let totalDaysWithEntries = 0;
      
      for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
        if (weekCounts[index][weekIdx]) {
          weeksWithData++;
          totalDaysWithEntries += weekCounts[index][weekIdx].size;
        }
      }
      
      // Calculate the average - if there are no weeks with data, return 0
      if (weeksWithData === 0) return 0;
      
      // Calculate average events per day
      return totalDaysWithEntries / weeksWithData;
    });
    
    // Log the results
    console.log('Weeks with data:', {
      weeks: weekStarts.map(d => d.toLocaleDateString()),
      weekCounts
    });
    
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
    if (supabase) {
      fetchExpectedOccupancy();
    }
  }, [parkingLotId, supabase]);
  
  // Add this function to render the expected occupancy chart
  const renderExpectedOccupancyChart = () => {
    if (isExpectedLoading) {
      return <div className="flex justify-center items-center h-64 text-gray-400">Loading data...</div>;
    }
    
    if (!expectedOccupancyData || !expectedOccupancyData.labels || expectedOccupancyData.counts.every((count: number) => count === 0)) {
      return <div className="flex justify-center items-center h-64 text-gray-400">No historical data available</div>;
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
  
  return (
    <div className="relative" style={{minHeight:"1200px"}}>
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
      
      <div className="mt-12">
        <div className="border-neutral-600 border-2 rounded-3xl" style={{ backgroundColor: "#333842", width: "650px", minWidth: "650px" }}>
          <div className="flex items-center py-4 px-6 relative">
            <h2 className="text-2xl font-semibold">Weekly Occupancy</h2>
            
            <div className="ml-auto flex items-center space-x-4">
              {/* Parking lot selector */}
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
      </div>
      <div className="mt-6">
        <div className="border-neutral-600 border-2 rounded-3xl" style={{ backgroundColor: "#333842", width: "650px", minWidth: "650px" }}>
          <div className="flex items-center py-4 px-6 relative">
            <h2 className="text-2xl font-semibold">Expected Occupancy</h2>
            
            <div className="ml-auto flex items-center space-x-4">
              {/* Parking lot selector - reuse the same one as above */}
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
            </div>
          </div>
          
          <hr className="border-neutral-600 border-2" />
          
          <div className="p-6">
            {renderExpectedOccupancyChart()}
          </div>
        </div>
      </div>
    </div>
  );
}