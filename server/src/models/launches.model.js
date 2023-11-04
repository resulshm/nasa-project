const axios = require("axios");
const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const defaultFlightNumber = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v5/launches/query";

async function populateLaunches() {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Could not send post request to SpaceX API");
    throw new Error("Error in downloading Launches data");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers: customers,
    };

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const firstLaunch = await existsLaunchWithId(1);
  if (firstLaunch) {
    console.log("Launches already populated");
    return;
  }
  console.log("Start downloading launches from SpaceX...");
  await populateLaunches();
  console.log("Added launches from SpaceX");
}

async function saveLaunch(launch) {
  await launches.updateOne(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    { upsert: true }
  );
}

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");
  if (!latestLaunch) {
    return defaultFlightNumber;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches() {
  return await launches.find(
    {},
    {
      _id: 0,
      __v: 0,
    }
  );
}

async function scheduleLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("Invalid target: No matching planet found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  try {
    await saveLaunch(
      Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ["ZTM", "NASA"],
        upcoming: true,
        success: true,
      })
    );
  } catch (err) {
    console.error(`Could not schedule new launch: ${err}`);
  }
}

async function existsLaunchWithId(launchId) {
  return await launches.findOne({
    flightNumber: launchId,
  });
}

async function abortLaunchById(launchId) {
  const aborted = await launches.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.ok === 1 && aborted.nModified === 1;
}

module.exports = {
  loadLaunchesData,
  getAllLaunches,
  scheduleLaunch,
  existsLaunchWithId,
  abortLaunchById,
};
