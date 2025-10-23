import React from "react";
import styled from "styled-components";

interface AddProductButtonProps {
  className?: string;
  [key: string]: any; // For props passed by DialogTrigger
}

const AddProductButton: React.FC<AddProductButtonProps> = ({
  className,
  ...props
}) => {
  return (
    <StyledWrapper>
      <button type="button" className={`button ${className || ""}`} {...props}>
        <span className="button__text">Add Product</span>
        <span className="button__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            stroke="currentColor"
            height={24}
            fill="none"
            className="svg"
          >
            <line y2={19} y1={5} x2={12} x1={12} />
            <line y2={12} y1={12} x2={19} x1={5} />
          </svg>
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    position: relative;
    width: 150px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid #34974d;
    background-color: #3aa856;
    border-radius: 8px; /* Added for rounded corners */
  }

  .button,
  .button__icon,
  .button__text {
    transition: all 0.3s;
  }

  .button .button__text {
    transform: translateX(10px); /* Reduced from 30px to prevent cutoff */
    color: #fff;
    font-weight: 600;
  }

  .button .button__icon {
    position: absolute;
    transform: translateX(
      115px
    ); /* Adjusted from 109px to move icon further right */
    height: 100%;
    width: 39px;
    background-color: #34974d;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top-right-radius: 8px; /* Match button's rounded corners */
    border-bottom-right-radius: 8px; /* Match button's rounded corners */
  }

  .button .svg {
    width: 24px; /* Slightly reduced to fit better */
    stroke: #fff;
  }

  .button:hover {
    background: #34974d;
  }

  .button:hover .button__text {
    color: transparent;
  }

  .button:hover .button__icon {
    width: 148px;
    transform: translateX(0);
  }

  .button:active .button__icon {
    background-color: #2e8644;
  }

  .button:active {
    border: 1px solid #2e8644;
  }
`;

export default AddProductButton;
