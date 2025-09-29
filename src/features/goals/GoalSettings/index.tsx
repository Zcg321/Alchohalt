// AUTO-SPLIT BY CODEX
import React from "react";
import TopSection from "./TopSection";
import BehaviorSection from "./BehaviorSection";
import SpendSection from "./SpendSection";
export type GoalSettingsProps = { children?: React.ReactNode };
export default function GoalSettings(props: GoalSettingsProps){
  return (<div data-testid="GoalSettings-root"><TopSection/><BehaviorSection/><SpendSection/>{props.children}</div>);
}
