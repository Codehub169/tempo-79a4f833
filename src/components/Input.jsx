import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => {
  const baseStyles = 'input-field w-full p-4 text-base rounded-xl border border-border-color bg-sidebar-background text-text-color transition-all duration-150 ease-out focus:outline-none focus:border-primary-color focus:ring-4 focus:ring-primary-color/30';

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${baseStyles} ${className}`}
      {...props}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
};

export default Input;
