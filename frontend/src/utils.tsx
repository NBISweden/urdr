import.meta.hot;

export const { SNOWPACK_PUBLIC_API_URL } = __SNOWPACK_ENV__;

export let headers = new Headers();
headers.set("Accept", "application/json");
headers.set("Content-Type", "application/json");

export const getApiEndpoint = async (endpoint) => {
  let result = await fetch(`${SNOWPACK_PUBLIC_API_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
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
