import React from "react";
import { Flex, Box, Text, Button as RebassButton } from "rebass";
import { Input, Checkbox, Label } from "@rebass/forms";
import * as Icon from "react-feather";
import Dialog from "./dialog";
import { showSnack } from "../snackbar";

export default class AddNotebookDialog extends React.Component {
  MAX_AVAILABLE_HEIGHT = window.innerHeight * 0.3;
  title = "";
  description = "";
  _inputRefs = [];
  lastLength = 0;
  topics = [""];
  state = {
    topics: [""],
    focusedInputIndex: 0
  };

  performActionOnTopic(index) {
    if (this.state.focusedInputIndex !== index) {
      this.removeTopic(index);
    } else {
      this.addTopic(index);
    }
  }

  removeTopic(index) {
    this._action(index, 1);
  }

  addTopic(index) {
    this._action(index + 1, 0, "");
  }

  _action(index, deleteCount, replaceItem) {
    if (replaceItem !== undefined)
      this.topics.splice(index, deleteCount, replaceItem);
    else this.topics.splice(index, deleteCount);

    this.setState({ topics: this.topics }, () =>
      setTimeout(() => {
        this._inputRefs[index].focus();
      }, 0)
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isOpen === false) {
      this._reset();
    }
  }

  _reset() {
    this.title = "";
    this.description = "";
    this._inputRefs = [];
    this.lastLength = 0;
    this.setState({
      topics: [""],
      focusedInputIndex: 0
    });
  }

  render() {
    const props = this.props;
    return (
      <Dialog
        isOpen={props.isOpen}
        title="Notebook"
        icon={Icon.BookOpen}
        content={
          <Box my={1}>
            <Input
              autoFocus
              variant="default"
              onChange={e => (this.title = e.target.value)}
              placeholder="Enter name"
            />
            <Input
              variant="default"
              sx={{ marginTop: 1 }}
              onChange={e => (this.description = e.target.value)}
              placeholder="Enter description (optional)"
            />
            <Label alignItems="center" my={1}>
              <Checkbox variant="checkbox" />
              Locked?
            </Label>
            <Text variant="body" fontWeight="bold" my={1}>
              Topics (optional):
            </Text>
            <Box
              sx={{
                maxHeight: this.MAX_AVAILABLE_HEIGHT,
                overflowY: "auto",
                marginBottom: 1
              }}
            >
              {this.topics.map((value, index) => (
                <Flex
                  key={index.toString()}
                  flexDirection="row"
                  sx={{ marginBottom: 1 }}
                >
                  <Input
                    ref={ref => {
                      this._inputRefs[index] = ref;
                      if (ref) ref.value = value; // set default value
                    }}
                    variant="default"
                    placeholder="Topic name"
                    onFocus={e => {
                      this.lastLength = e.nativeEvent.target.value.length;
                      if (this.state.focusedInputIndex === index) return;
                      this.setState({ focusedInputIndex: index });
                    }}
                    onChange={e => {
                      this.topics[index] = e.target.value;
                    }}
                    onKeyUp={e => {
                      if (e.nativeEvent.key === "Enter") {
                        this.addTopic(index);
                      } else if (
                        e.nativeEvent.key === "Backspace" &&
                        this.lastLength === 0 &&
                        index > 0
                      ) {
                        this.removeTopic(index);
                      }
                      this.lastLength = e.nativeEvent.target.value.length;
                    }}
                  />
                  <RebassButton
                    variant="tertiary"
                    sx={{ marginLeft: 1 }}
                    px={2}
                    py={1}
                    onClick={() => this.performActionOnTopic(index)}
                  >
                    <Box height={20}>
                      {this.state.focusedInputIndex === index ? (
                        <Icon.Plus size={20} />
                      ) : (
                        <Icon.Minus size={20} />
                      )}
                    </Box>
                  </RebassButton>
                </Flex>
              ))}
            </Box>
          </Box>
        }
        positiveButton={{
          text: "Add",
          onClick: () => {
            if (!this.title.trim().length)
              return showSnack("Please enter the notebook title.");
            props.onDone({
              title: this.title,
              description: this.description,
              topics: this.topics
            });
          }
        }}
        negativeButton={{ text: "Cancel", onClick: props.close }}
      />
    );
  }
}
