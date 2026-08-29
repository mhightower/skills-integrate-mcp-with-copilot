document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupButton = document.getElementById("activity-signup-btn");
  const messageDiv = document.getElementById("message");
  const authStatus = document.getElementById("auth-status");
  const authActions = document.getElementById("auth-actions");
  const signupAccountForm = document.getElementById("signup-account-form");
  const signinForm = document.getElementById("signin-form");
  const signoutBtn = document.getElementById("signout-btn");

  let currentStudent = null;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function getAuthHeaders() {
    if (!currentStudent) {
      return {};
    }

    return {
      "X-Student-Email": currentStudent.email,
    };
  }

  function updateAuthUI() {
    if (currentStudent) {
      authStatus.textContent = `Signed in as ${currentStudent.name} (Grade ${currentStudent.grade})`;
      authActions.classList.add("hidden");
      signoutBtn.classList.remove("hidden");
      signupButton.disabled = false;
    } else {
      authStatus.textContent = "You are not signed in.";
      authActions.classList.remove("hidden");
      signoutBtn.classList.add("hidden");
      signupButton.disabled = true;
    }
  }

  async function restoreSession() {
    const savedEmail = localStorage.getItem("studentEmail");
    if (!savedEmail) {
      updateAuthUI();
      return;
    }

    try {
      const response = await fetch("/auth/me", {
        headers: {
          "X-Student-Email": savedEmail,
        },
      });

      if (!response.ok) {
        currentStudent = null;
        localStorage.removeItem("studentEmail");
        updateAuthUI();
        return;
      }

      const result = await response.json();
      currentStudent = result.student;
      updateAuthUI();
    } catch (error) {
      currentStudent = null;
      localStorage.removeItem("studentEmail");
      updateAuthUI();
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        currentStudent && currentStudent.email === email
                          ? `<button class="delete-btn" data-activity="${name}">Unregister Me</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  signupAccountForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById("student-name").value,
      grade: document.getElementById("student-grade").value,
      email: document.getElementById("student-email").value,
    };

    try {
      const response = await fetch("/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Could not create account", "error");
        return;
      }

      currentStudent = result.student;
      localStorage.setItem("studentEmail", currentStudent.email);
      signupAccountForm.reset();
      updateAuthUI();
      showMessage("Account created and signed in.", "success");
      fetchActivities();
    } catch (error) {
      showMessage("Failed to create account. Please try again.", "error");
    }
  });

  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      email: document.getElementById("signin-email").value,
    };

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Could not sign in", "error");
        return;
      }

      currentStudent = result.student;
      localStorage.setItem("studentEmail", currentStudent.email);
      signinForm.reset();
      updateAuthUI();
      showMessage("Signed in successfully.", "success");
      fetchActivities();
    } catch (error) {
      showMessage("Failed to sign in. Please try again.", "error");
    }
  });

  signoutBtn.addEventListener("click", () => {
    currentStudent = null;
    localStorage.removeItem("studentEmail");
    updateAuthUI();
    showMessage("Signed out.", "info");
    fetchActivities();
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("activity").value;

    if (!currentStudent) {
      showMessage("Please sign in before registering for an activity.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  restoreSession().then(fetchActivities);
});
