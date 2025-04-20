let editorInstances = {};
let currentTabId = null;
let tabCounter = 0;

// Helper: Create a new editor tab
function createNewTab(initialCode = "") {
  tabCounter++;
  const tabId = `tab${tabCounter}`;

  // Create tab button
  const tabButton = document.createElement("div");
  tabButton.className = "tab";
  tabButton.innerText = `Tab ${tabCounter}`;
  tabButton.dataset.tabId = tabId;
  tabButton.onclick = () => switchTab(tabId);
  document.getElementById("tab-bar").appendChild(tabButton);

  // Create editor pane
  const editorPane = document.createElement("div");
  editorPane.id = tabId;
  editorPane.className = "editor-pane";
  document.getElementById("editorContainer").appendChild(editorPane);

  // Create Ace editor instance
  const editor = ace.edit(tabId);
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/verilog");
  editor.setOptions({
    enableLiveAutocompletion: true,
    enableSnippets: true,
    fontSize: "14pt",
    wrap: true,
  });
  editor.setValue(initialCode, -1);

  editorInstances[tabId] = editor;
  switchTab(tabId);
}

// Helper: Switch active tab
function switchTab(tabId) {
  currentTabId = tabId;

  // Hide all editors and remove tab highlight
  document.querySelectorAll(".editor-pane").forEach(pane => {
    pane.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  // Show current editor and highlight tab
  document.getElementById(tabId).classList.add("active");
  document.querySelector(`.tab[data-tab-id="${tabId}"]`).classList.add("active");
}

// Theme Toggle
document.getElementById("toggleTheme").onclick = function () {
  const editor = editorInstances[currentTabId];
  const current = editor.getTheme();
  const newTheme = current === "ace/theme/monokai" ? "ace/theme/github" : "ace/theme/monokai";
  editor.setTheme(newTheme);
};

// File Upload
document.getElementById("uploadFile").addEventListener("change", function (e) {
  const reader = new FileReader();
  reader.onload = function () {
    editorInstances[currentTabId].setValue(reader.result, -1);
  };
  if (e.target.files[0]) reader.readAsText(e.target.files[0]);
  else alert("No file selected");
});

// Download
document.getElementById("downloadBtn").onclick = function () {
  const code = editorInstances[currentTabId].getValue();
  const blob = new Blob([code], { type: "text/plain" });
  const link = document.createElement("a");
  link.download = `${currentTabId || "verilog_code"}.v`;
  link.href = URL.createObjectURL(blob);
  link.click();
};

// Example snippets
const examples = {
  hello: `module hello;
initial begin
  $display("Hello, VLSI World!");
  $finish;
end
endmodule`,

  counter: `module counter;
reg [3:0] count;
initial begin
  count = 0;
  repeat (10) begin
    #5 count = count + 1;
    $display("Count = %d", count);
  end
  $finish;
end
endmodule`
};

document.getElementById("exampleSelector").onchange = function (e) {
  const selected = e.target.value;
  if (examples[selected]) {
    editorInstances[currentTabId].setValue(examples[selected], -1);
  }
};

// Run simulation
document.getElementById("runBtn").onclick = async function () {
  const code = editorInstances[currentTabId].getValue();
  document.getElementById("output").innerText = "⏳ Compiling and simulating...";

  try {
    const response = await fetch("http://localhost:5000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    if (!response.ok) throw new Error("Server error");

    const result = await response.json();
    document.getElementById("output").innerText = result.output;

    // Color feedback
    const editor = editorInstances[currentTabId];
    editor.container.style.border = result.output.toLowerCase().includes("error")
      ? "2px solid red"
      : "2px solid green";

  } catch (err) {
    console.error("Compile error:", err);
    document.getElementById("output").innerText = "Error occurred while compiling.";
    editorInstances[currentTabId].container.style.border = "2px solid red";
  }
};

// Server check
async function checkServerStatus() {
  try {
    const res = await fetch("http://localhost:5000");
    if (!res.ok) throw new Error("Unreachable");
    console.log("Backend reachable");
  } catch (e) {
    console.error("Server not reachable:", e);
    alert("Backend server is not reachable. Make sure it's running on http://localhost:5000");
  }
}

// New tab handler
document.getElementById("newTabBtn").onclick = () => createNewTab("");

// Initial setup
window.onload = () => {
  createNewTab(`module hello;
initial begin
  $display("Hello, VLSI World!");
  $finish;
end
endmodule`);
  checkServerStatus();
};
