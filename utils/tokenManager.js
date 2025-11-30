// Token and user management utilities

async function findAccessToken() {
    // Try to get token and userId from chrome storage first
    const result = await chrome.storage.local.get(["smo_token", "smo_userId", "smo_username"]);
    if (result.smo_token) {
        AppState.currentUserId = result.smo_userId || null;
        AppState.currentUsername = result.smo_username || null;
        return result.smo_token;
    }
    return null;
}

async function fetchCurrentUserId() {
    const worklogContainer = document.getElementById("worklogContainer");

    try {
        const html = await loadTemplate("loading-user-info");
        worklogContainer.innerHTML = html;

        const response = await fetch(
            "https://sra-api.smartosc.com/api/users/current-user",
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    authorization: `Bearer ${AppState.currentToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to fetch user info: ${response.status} - ${errorText}`
            );
        }

        // Check if response has content before parsing JSON
        const responseText = await response.text();
        if (!responseText || responseText.trim() === "") {
            throw new Error("Empty response received from server");
        }

        const userData = JSON.parse(responseText);
        AppState.currentUserId = userData.id;
        AppState.currentUsername = userData.username || userData.userName || null;

        // Save user ID and username to chrome storage
        await chrome.storage.local.set({
            smo_userId: AppState.currentUserId,
            smo_username: AppState.currentUsername
        });

        // Fetch and display user rates if token is valid
        const ratesData = await fetchUserRates(AppState.currentUserId);
        if (ratesData) {
            displayUserRatesTable(ratesData, worklogContainer);
        }
    } catch (error) {
        alert(
            `Error fetching user information: ${error.message}\nPlease check if your token is valid.`
        );
        throw error;
    }
}

async function fetchUserRates(userId) {
    try {
        const response = await fetch(
            `https://sra-api.smartosc.com/api/users/${userId}/user-rate`,
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    authorization: `Bearer ${AppState.currentToken}`,
                },
            }
        );

        if (!response.ok) {
            return null; // Token invalid or error
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === "") {
            return null;
        }

        const ratesData = JSON.parse(responseText);
        return ratesData;
    } catch (error) {
        console.error("Error fetching user rates:", error);
        return null;
    }
}

function displayUserRatesTable(ratesData, container) {
    if (!ratesData || ratesData.length === 0) {
        return;
    }

    // Calculate Allocation Rate: average of busy_rate from first 2 items
    const firstTwoBusyRates = ratesData.slice(0, 2).map(item => item.data.busy_rate || 0);
    const allocationRate = firstTwoBusyRates.length > 0
        ? firstTwoBusyRates.reduce((sum, rate) => sum + rate, 0) / firstTwoBusyRates.length
        : 0;

    // Calculate Utilization Rate: average of utilization_rate from first 2 items
    const firstTwoUtilizationRates = ratesData.slice(0, 2).map(item => item.data.utilization_rate || 0);
    const utilizationRate = firstTwoUtilizationRates.length > 0
        ? firstTwoUtilizationRates.reduce((sum, rate) => sum + rate, 0) / firstTwoUtilizationRates.length
        : 0;

    // Calculate Work Log Rate: average of work_log_rate from first 2 items
    const firstTwoWorkLogRates = ratesData.slice(0, 2).map(item => item.data.work_log_rate || 0);
    const workLogRate = firstTwoWorkLogRates.length > 0
        ? firstTwoWorkLogRates.reduce((sum, rate) => sum + rate, 0) / firstTwoWorkLogRates.length
        : 0;

    const allocationColor = allocationRate < 80 ? "rgba(244, 67, 54, 0.8)" : "rgba(76, 175, 80, 0.8)";
    const utilizationColor = utilizationRate < 80 ? "rgba(244, 67, 54, 0.8)" : "rgba(76, 175, 80, 0.8)";
    const workLogColor = workLogRate < 80 ? "rgba(244, 67, 54, 0.8)" : "rgba(76, 175, 80, 0.8)";

    const ratesTableHtml = `
    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 15px; border-radius: 12px; margin: 15px 0; border: 1px solid rgba(255, 255, 255, 0.2);">
      <h4 style="margin-top: 0; color: rgba(255, 255, 255, 0.95); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);">
        User Rates
      </h4>
      <table style="width: 100%; border-collapse: collapse; color: rgba(255, 255, 255, 0.9);">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">Rate Type</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Allocation Rate</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <span style="color: ${allocationColor}; font-weight: bold;">${allocationRate.toFixed(2)}%</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Utilization Rate</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <span style="color: ${utilizationColor}; font-weight: bold;">${utilizationRate.toFixed(2)}%</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px;">Work Log Rate</td>
            <td style="padding: 8px; text-align: right;">
              <span style="color: ${workLogColor}; font-weight: bold;">${workLogRate.toFixed(2)}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

    // Insert the table into the container
    container.insertAdjacentHTML('beforeend', ratesTableHtml);
}

