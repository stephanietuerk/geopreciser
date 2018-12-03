import React, { Component } from "react";
import styled, { keyframes } from "styled-components";


const DotWrapper = styled.div`
  display: flex;
  align-items: flex-end;
`;

const blink = keyframes`
  50% {opacity: 0.0;}
`;

const Dot = styled.div`
  background-color: black;
  border-radius: 50%;
  width: 2px;
  height: 2px;
  margin: 0 5px;
  /* Animation */
  animation: 1s ${blink} 0.5s linear infinite;
  animation-delay: ${props => props.delay};
`;

class AnimatedDots extends Component {
  render() {
    return (
      <DotWrapper>
        <Dot delay='0ms'/>
        <Dot delay='250ms'/>
        <Dot delay='500ms'/>
      </DotWrapper>
    )
  }
}
export default AnimatedDots
