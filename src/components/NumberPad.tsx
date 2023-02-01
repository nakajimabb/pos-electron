import React, { useEffect, useState } from 'react';

type Props = {
  id: string;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputFocus: string;
  setInputFocus: React.Dispatch<React.SetStateAction<string>>;
};

const NumberPad: React.FC<Props> = (props) => {
  const keyboardValues = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '-', 'C'];
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Methods
  const handleInputChange = (newValue: string) => {
    const inputKeyboardValues = keyboardValues.filter((keyboardValue) => {
      // 入力可能な値のみを抽出

      const invalidValues = ['C'];

      return invalidValues.includes(keyboardValue) === false;
    });
    const pattern = new RegExp('^(' + inputKeyboardValues.join('|') + ')*$');

    if (pattern.test(newValue)) {
      props.setValue(newValue);
    }
  };
  const handlerKeyboardClick = (keyboardValue: string) => {
    const input = document.getElementById(props.id) as HTMLInputElement;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    let fullValue = props.value.toString();
    if (selectionStart !== selectionEnd) {
      fullValue = fullValue.slice(0, selectionStart) + fullValue.slice(selectionEnd);
    }
    let newValue = '';
    if (keyboardValue === 'C') {
      newValue = '0';
    } else if (keyboardValue === '-') {
      newValue = '-' + Math.abs(Number(props.value)).toString();
    } else {
      if (Number(props.value) == 0) {
        newValue = keyboardValue;
      } else {
        newValue = fullValue + keyboardValue;
      }
    }
    handleInputChange(newValue);
  };

  // Effect
  useEffect(() => {
    const input = document.getElementById(props.id) as HTMLInputElement;
    if (input) {
      setShowKeyboard(props.id === props.inputFocus);
    }
    console.log(props.inputFocus);
  }, [props.inputFocus]);

  return (
    <>
      <input
        id={props.id}
        type="text"
        placeholder="金額"
        value={props.value}
        inputMode="none"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
        onFocus={() => {
          props.setInputFocus(props.id);
        }}
        className="px-3 py-1.5 text-base text-right w-full rounded border leading-tight border-gray-300 shadow-md"
      />

      {showKeyboard && (
        <div className="p-0 border border-gray-50">
          <div className="grid grid-cols-3 gap-1 mt-1">
            {keyboardValues.map((keyboardValue, i) => (
              <button
                key={i}
                className="bg-blue-400 text-white p-1 h-12"
                onClick={() => handlerKeyboardClick(keyboardValue)}
              >
                {keyboardValue}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default NumberPad;
