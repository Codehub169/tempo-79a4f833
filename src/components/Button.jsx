import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
  const baseStyles = 'btn py-3 px-6 text-base font-semibold rounded-xl transition-all duration-150 ease-out inline-flex items-center justify-center whitespace-nowrap shadow-light focus:outline-none focus:ring-4 focus:ring-opacity-50';

  const variantStyles = {
    primary: 'btn-primary bg-gradient-to-br from-primary-color to-pink-500 text-background-color hover:shadow-primary-hover active:shadow-primary-active',
    secondary: 'btn-secondary bg-text-color/10 text-text-color border border-border-color hover:bg-text-color/20 hover:shadow-secondary-hover active:shadow-secondary-active',
    danger: 'btn-danger bg-danger-color text-text-color hover:bg-red-700 hover:shadow-danger-hover active:shadow-danger-active',
    warning: 'btn-warning bg-warning-color text-background-color hover:bg-yellow-600 hover:shadow-warning-hover active:shadow-warning-active',
    info: 'btn-info bg-info-color text-text-color hover:bg-blue-600 hover:shadow-info-hover active:shadow-info-active',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed transform-none shadow-none';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? disabledStyles : ''} ${className}`}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'warning', 'info']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
