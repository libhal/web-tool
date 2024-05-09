document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#connect-btn").addEventListener("click", async () => {
    device_connected ? disconnectFromDevice() : connectToDevice();
  });

  document.querySelector("#baudrate").addEventListener("change", function () {
    const baudrate_input = document.querySelector("#baudrate-input");
    if (this.value === "custom") {
      baudrate_input.hidden = false;
      baudrate_input.focus();
    } else {
      baudrate_input.hidden = true;
    }
  });
});
