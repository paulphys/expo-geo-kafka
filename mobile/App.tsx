import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { KAFKA_URL, KAFKA_TOKEN } from "@env"

const LOCATION_TASK_NAME = "LOCATION_TASK_NAME";
let foregroundSubscription = null;

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    // Extract location coordinates from data
    const location = data[0];
    if (location) {
      console.log("Location in background", location.coords);
    }
  }
});

export default function App() {

  // Define position state: {latitude: number, longitude: number}
  const [position, setPosition] = useState(null);

  const write2kafka = async (geo) => {
    try {
      geo.longitude = geo.longitude.toFixed(6)
      geo.latitude = geo.latitude.toFixed(6)

      delete geo.altitude
      delete geo.heading
      delete geo.speed
      delete geo.accuracy
      delete geo.altitudeAccuracy
      delete geo.mocked // only available on android

      const url = process.env.KAFKA_URL as string + encodeURIComponent(JSON.stringify(geo))
      await fetch(url,
        {
          headers: {
            Authorization:
              process.env.KAFKA_TOKEN as string,
          },
        }
      )
    } catch (error) {
      console.error(error);
    }
  };

  // Request permissions right after starting the app
  useEffect(() => {
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.granted)
        await Location.requestBackgroundPermissionsAsync();
    };
    requestPermissions();
  }, []);

  // Start location tracking in foreground
  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) {
      console.log("location tracking denied");
      return;
    }

    // Make sure that foreground location tracking is not running
    foregroundSubscription?.remove();

    // Start watching position in real-time
    foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 400, distanceInterval: 0.15      // android only and depends on accuracy value
      },
      (location) => {
        setPosition(location.coords);
        write2kafka(location.coords);
      }
    );
  };

  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove();
    setPosition(null);
  };

  // Start location tracking in background
  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const { granted } = await Location.getBackgroundPermissionsAsync();
    if (!granted) {
      console.log("location tracking denied");
      return;
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      console.log("Task is not defined");
      return;
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      console.log("Already started");
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      // Make sure to enable this notification if you want to consistently track in the background
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
    } );
            write2kafka(location);

  };

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("Location tacking stopped");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{fontSize: 20, color:"white"}}>Latitude: {position?.latitude?.toFixed(8)}</Text>
      <Text style={{fontSize: 20, color:"white"}}>Longitude: {position?.longitude?.toFixed(8)}</Text>
      <View style={styles.separator} />
      <Button
        onPress={startForegroundUpdate}
        title="Start foreground"
        color="green"
      />
      <View style={styles.separator} />
      <Button
        onPress={stopForegroundUpdate}
        title="Stop foreground"
        color="grey"
      />
      <View style={styles.separator} />
      <Button
        onPress={startBackgroundUpdate}
        title="Start background"
        color="green"
      />
      <View style={styles.separator} />
      <Button
        onPress={stopBackgroundUpdate}
        title="Stop background"
        color="grey"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    marginTop: 15,
  },
  separator: {
    marginVertical: 15,
  },
  text: { fontSize: 20, color:"white"}
});
