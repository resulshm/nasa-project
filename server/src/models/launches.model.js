const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const defaultFlightNumber = 100;

const launch = {
  flightNumber: 100,
  mission: "Kepler Exploration X",
  rocket: "Explorer IS1",
  launchDate: new Date("December 27, 2030"),
  target: "Kepler-442 b",
  customers: ["ZTM", "NASA"],
  upcoming: true,
  success: true,
};

//launches.set(launch.flightNumber, launch);

async function saveLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("Invalid target: No matching planet found");
  }

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

function addNewLaunch(launch) {
  lastFlightNumber++;
  launches.set(
    lastFlightNumber,
    Object.assign(launch, {
      flightNumber: lastFlightNumber,
      customers: ["ZTM", "NASA"],
      success: true,
      upcoming: true,
    })
  );
}

function existsLaunchWithId(launchId) {
  return launches.has(launchId);
}

function abortLaunchById(launchId) {
  const aborted = launches.get(launchId);
  aborted.success = false;
  aborted.upcoming = false;
  return aborted;
}

module.exports = {
  getAllLaunches,
  scheduleLaunch,
  existsLaunchWithId,
  abortLaunchById,
};
