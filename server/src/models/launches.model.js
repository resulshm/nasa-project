const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const defaultFlightNumber = 100;

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
  getAllLaunches,
  scheduleLaunch,
  existsLaunchWithId,
  abortLaunchById,
};
