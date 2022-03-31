import.meta.hot;

export const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;

export let headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

export const getApiEndpoint = async (endpoint) => {
  let result = await fetch(`${SNOWPACK_PUBLIC_API_URL}${endpoint}`, {
    method: "GET",
    headers: headers,
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else if (res.status === 401) {
        // Redirect to login page
        window.location.href = "/";
      } else {
        throw new Error(
          "There was an error accessing the endpoint " + endpoint
        );
      }
    })
    .catch((error) => console.log(error));
  return result;
};

const addDays = (date: Date, days: number) => {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
export const getFullWeek = (today: Date): Date[] => {
  let fullWeek = [];
  const todayDay = today.getDay(); // Sunday - Saturday : 0 - 6
  let days = [];
  if (todayDay === 0) {
    days = [-6, -5, -4, -3, -2];
  } else if (todayDay === 1) {
    days = [0, 1, 2, 3, 4];
  } else if (todayDay === 2) {
    days = [-1, 0, 1, 2, 3];
  } else if (todayDay === 3) {
    days = [-2, -1, 0, 1, 2];
  } else if (todayDay === 4) {
    days = [-3, -2, -1, 0, 1];
  } else if (todayDay === 5) {
    days = [-4, -3, -2, -1, 0];
  } else if (todayDay === 6) {
    days = [-5, -4, -3, -2, -1];
  }
  days.forEach((day) => {
    fullWeek.push(addDays(today, day));
  });
  return fullWeek;
};
