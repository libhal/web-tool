// Copyright 2024 Khalil Estell
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

let port;
let reader;
let writer;
let device_connected = false;
const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder("utf-8");

function getBaudRate() {
  let baudrate = document.querySelector("#baudrate").value;
  if (baudrate === "custom") {
    baudrate = document.querySelector("#baudrate-input").value;
  }
  return Number(baudrate);
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function initSerialCanBus() {
  const text_decoder = new TextDecoder();

  if (!(port.readable && device_connected)) {
    port.close();
    throw "Failure to use device!";
  }

  try {
    console.log("sending 4 carriage returns");
    writer.write(encoder.encode("\r\r\r\r"));
    await sleep(250);

    console.log("sending V");
    writer.write(encoder.encode("V\r"));
    await sleep(250);

    let { response, _ } = await reader.read();
    console.log("version ", text_decoder.decode(response));

    console.log("sending S3");
    writer.write(encoder.encode("S3\r"));
    await sleep(250);

    console.log("sending O");
    writer.write(encoder.encode("O\r"));
    await sleep(250);

    console.log("sending t10021133");
    writer.write(encoder.encode("t10021133\r"));
    await sleep(250);

    // console.log("", text_decoder.decode(response));
  } catch (error) {
    disconnectFromDevice();
    console.error(error);
  } finally {
    reader.releaseLock();
  }
}

async function connectToDevice() {
  try {
    port = await navigator.serial.requestPort();

    const baud_rate = getBaudRate();
    await port.open({ baudRate: baud_rate });
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    device_connected = true;
    document.querySelector("#connect-btn").innerText = "Disconnect";
    document.querySelector("#baudrate").setAttribute("disabled", true);
    reader = port.readable.getReader();
    writer = port.writable.getWriter();
    await initSerialCanBus();
    // readFromDevice();
  } catch (error) {
    const notFoundText = "NotFoundError:";
    const userCancelledConnecting = String(error).startsWith(notFoundText);
    if (!userCancelledConnecting) {
      alert(`Could not connect to serial device: ${error}`);
    }
  }
}

async function readFromDevice() {
  while (port.readable && device_connected) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        let decoded = new TextDecoder().decode(value);
        decoded = decoded.replace(/\n/g, "\r\n");
        console.log("can data: ", decoded);
      }
    } catch (error) {
      disconnectFromDevice();
      console.error(error);
    } finally {
      reader.releaseLock();
    }
  }
  await port.close();
}

async function writeToDevice(input) {
  if (port.writable) {
    writer = port.writable.getWriter();
    try {
      await writer.write(encoder.encode(input));
    } catch (error) {
      console.error(error);
    } finally {
      writer.releaseLock();
    }
  }
}

async function writeCharacterToDevice(input) {
  if (port.writable) {
    writer = port.writable.getWriter();
    try {
      await writer.write(encoder.encode(input));
    } catch (error) {
      console.error(error);
    } finally {
      writer.releaseLock();
    }
  }
}

function disconnectFromDevice() {
  device_connected = false;
  if (reader && reader.cancel) {
    reader.cancel();
  }
  document.querySelector("#connect-btn").innerText = "Connect";
  document.querySelector("#baudrate").removeAttribute("disabled");
}
