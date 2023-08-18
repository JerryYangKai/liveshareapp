import React from "react";
import { Component } from "react";
import * as Teams from "@microsoft/teams-js";
import { LiveShareClient } from "@microsoft/live-share";
import {
  InkingManager,
  InkingTool,
  LiveCanvas,
} from "@microsoft/live-share-canvas";
import { SharedMap } from "fluid-framework";
import { PrimaryButton, Stack, Text, Label } from "@fluentui/react";
import Editor from "@monaco-editor/react";

const containerSchema = {
  initialObjects: {
    liveCanvas: LiveCanvas,
    editorMap: SharedMap,
  },
};

const buttonStyle = {
  fontSize: "12px",
  padding: "0px 10px",
  margin: "0 5px",
};

const rowStyle = {
  marginBottom: "10px",
};

let containerValue;

class Stage extends Component {
  _inkingManager;

  constructor(props) {
    super(props);
    this.liveCanvasRef = React.createRef();
    this.state = {
      active: true,
      tool: InkingTool.pen,
      isCursorShared: true,
      teamsLiveCanvas: null,
      data: "", // data to be sent to the Monaco editor
    };
  }

  componentDidMount() {
    this.internalStart().catch((error) => {
      console.error(error);
    });
  }

  async internalStart() {
    await Teams.app.initialize();
    Teams.app.notifySuccess();
    window.localStorage.debug = "fluid:*";
    const host = Teams.LiveShareHost.create();
    const client = new LiveShareClient(host);

    function onContainerFirstCreated(container) {
      // Set initial state of the editorMap.
      container.initialObjects.editorMap.set("editor-value-key", 1);
    }

    const { container } = await client.joinContainer(
      containerSchema,
      onContainerFirstCreated
    );
    containerValue = container;
    containerValue.initialObjects.editorMap.on(
      "valueChanged",
      this.updateEditorState
    );
    const inkingHost = document.getElementById("inkingHost");

    if (inkingHost) {
      const liveCanvas = container.initialObjects.liveCanvas;

      this._inkingManager = new InkingManager(inkingHost);

      await liveCanvas.initialize(this._inkingManager);
      this.setState({ teamsLiveCanvas: liveCanvas });

      this._inkingManager.activate();
    }
  }

  updateEditorState = () => {
    const editorValue =
      containerValue.initialObjects.editorMap.get("editor-value-key");
    this.setState({ data: editorValue });
  };

  handleClick = (value) => {
    const editorMap = containerValue.initialObjects.editorMap;
    editorMap.set("editor-value-key", value);
  };

  render() {
    const setToPen = () => {
      if (this._inkingManager) {
        this._inkingManager.tool = InkingTool.pen;
      }
    };

    const setToLaserPointer = () => {
      if (this._inkingManager) {
        this._inkingManager.tool = InkingTool.laserPointer;
      }
    };

    const setToHighlighter = () => {
      if (this._inkingManager) {
        this._inkingManager.tool = InkingTool.highlighter;
      }
    };

    const setToEraser = () => {
      if (this._inkingManager) {
        this._inkingManager.tool = InkingTool.pointEraser;
      }
    };

    const setToBlackBrush = () => {
      if (this._inkingManager) {
        this._inkingManager.penBrush.color = { r: 0, g: 0, b: 0 };
      }
    };

    const setToBlueBrush = () => {
      if (this._inkingManager) {
        this._inkingManager.penBrush.color = { r: 0, g: 0, b: 255, a: 1 };
      }
    };

    const setToRedBrush = () => {
      if (this._inkingManager) {
        this._inkingManager.penBrush.color = { r: 255, g: 0, b: 0 };
      }
    };

    const clearCanvas = () => {
      if (this._inkingManager) {
        this._inkingManager.clear();
      }
    };

    const defaultQuestion = {
      question:
        "Write a program to accept N numbers and arrange them in an ascending order",
      expectedOutput:
        "For array with 7 elements containing [6,3,7,4,2,0,8] the output will be [0,2,3,4,6,7,8]",
      language: "csharp",
      defaultValue:
        "using System;\nnamespace SortAnArray\n{\n public class SortAnArray\n  {\n    static void Main(string[] args) { \n     // Write your code here \n   }\n  }\n}",
    };

    return (
      <div>
        <div
          id="canvasContainer"
          style={{
            border: "2px solid blue",
            padding: "10px",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            id="inkingHost"
            ref={this.liveCanvasRef}
            style={{
              width: "100%",
              height: "400px",
              marginBottom: "10px",
              border: "2px solid yellow",
            }}
          />
          {this.state.teamsLiveCanvas && (
            <div>
              <div style={rowStyle}>
                <strong>Tools:</strong>
                <PrimaryButton style={buttonStyle} onClick={setToPen}>
                  Pen
                </PrimaryButton>
                <PrimaryButton style={buttonStyle} onClick={setToEraser}>
                  Eraser
                </PrimaryButton>
              </div>
              <div style={rowStyle}>
                <strong>Pen Color:</strong>
                <PrimaryButton style={buttonStyle} onClick={setToBlueBrush}>
                  Blue brush
                </PrimaryButton>
                <PrimaryButton style={buttonStyle} onClick={setToBlackBrush}>
                  Black brush
                </PrimaryButton>
                <PrimaryButton style={buttonStyle} onClick={setToRedBrush}>
                  Red brush
                </PrimaryButton>
              </div>
              <div style={rowStyle}>
                <strong>Pointer:</strong>
                <PrimaryButton style={buttonStyle} onClick={setToHighlighter}>
                  Highlighter
                </PrimaryButton>
                <PrimaryButton style={buttonStyle} onClick={setToLaserPointer}>
                  Laser Pointer
                </PrimaryButton>
              </div>
              <div style={rowStyle}>
                <strong>Actions:</strong>
                <PrimaryButton style={buttonStyle} onClick={clearCanvas}>
                  Clear
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
        {this.state.teamsLiveCanvas && (
          <div
            id="editorContainer"
            style={{ position: "relative", width: "100%" }}
          >
            <Stack tokens={{ childrenGap: 20 }} style={{ padding: "20px" }}>
              <Text variant="xLarge">{defaultQuestion.question}</Text>
              <Stack horizontal tokens={{ childrenGap: 20 }}>
                <Stack.Item>
                  <Label>Language:</Label>
                  <Text>{defaultQuestion.language}</Text>
                </Stack.Item>
                <Stack.Item>
                  <Label>Expected Output:</Label>
                  <Text>{defaultQuestion.expectedOutput}</Text>
                </Stack.Item>
              </Stack>
              <Editor
                height="80vh"
                defaultLanguage={defaultQuestion.language}
                defaultValue={defaultQuestion.defaultValue}
                value={this.state.data}
                onChange={this.handleClick}
              />
            </Stack>
          </div>
        )}
      </div>
    );
  }
}

export default Stage;
