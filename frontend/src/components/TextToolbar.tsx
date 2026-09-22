import {
  Minus,
  Plus,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
} from 'react'

interface TextToolbarProps {
  fontSize: number

  bold: boolean
  italic: boolean
  underline: boolean

  onChangeFontSize: (
    fontSize: number,
  ) => void

  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
}

const MIN_FONT_SIZE = 6
const MAX_FONT_SIZE = 200

export default function TextToolbar({
  fontSize,

  bold,
  italic,
  underline,

  onChangeFontSize,

  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
}: TextToolbarProps) {
  const [
    inputValue,
    setInputValue,
  ] = useState(
    String(fontSize),
  )

  const skipBlurCommitRef =
    useRef(false)

  // Đồng bộ input với font size
  // thực tế của Text Element
  useEffect(() => {
    setInputValue(
      String(fontSize),
    )
  }, [fontSize])

  // ------------------------------------------
  // COMMIT
  // ------------------------------------------

  const commitFontSize = () => {
    const parsed =
      Number(inputValue)

    if (
      !Number.isFinite(parsed) ||
      inputValue === ''
    ) {
      setInputValue(
        String(fontSize),
      )
      return
    }

    const nextFontSize =
      Math.max(
        MIN_FONT_SIZE,
        Math.min(
          MAX_FONT_SIZE,
          parsed,
        ),
      )

    setInputValue(
      String(nextFontSize),
    )

    if (
      nextFontSize !== fontSize
    ) {
      onChangeFontSize(
        nextFontSize,
      )
    }
  }

  // ------------------------------------------
  // INPUT CHANGE
  // ------------------------------------------

  const handleInputChange = (
    value: string,
  ) => {
    if (value === '') {
      setInputValue('')
      return
    }

    if (!/^\d+$/.test(value)) {
      return
    }

    setInputValue(value)
  }

  // ------------------------------------------
  // KEYBOARD
  // ------------------------------------------

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Quan trọng:
    // Không cho event đi xuống PDFPage
    event.stopPropagation()

    if (event.key === 'Enter') {
      event.preventDefault()

      commitFontSize()

      event.currentTarget.blur()

      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()

      // Báo cho onBlur rằng lần blur này
      // là do Escape -> KHÔNG commit
      skipBlurCommitRef.current =
        true

      // Khôi phục giá trị ban đầu
      setInputValue(
        String(fontSize),
      )

      event.currentTarget.blur()

      return
    }
  }

  // ------------------------------------------
  // BLUR
  // ------------------------------------------

  const handleBlur = () => {
    if (
      skipBlurCommitRef.current
    ) {
      skipBlurCommitRef.current =
        false

      return
    }

    commitFontSize()
  }

  // ------------------------------------------
  // DECREASE
  // ------------------------------------------

  const decrease = () => {
    const nextFontSize =
      Math.max(
        MIN_FONT_SIZE,
        fontSize - 1,
      )

    if (
      nextFontSize === fontSize
    ) {
      return
    }

    onChangeFontSize(
      nextFontSize,
    )
  }

  // ------------------------------------------
  // INCREASE
  // ------------------------------------------

  const increase = () => {
    const nextFontSize =
      Math.min(
        MAX_FONT_SIZE,
        fontSize + 1,
      )

    if (
      nextFontSize === fontSize
    ) {
      return
    }

    onChangeFontSize(
      nextFontSize,
    )
  }

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <div
      className="text-toolbar"
      onMouseDown={(event) => {
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <button
        type="button"
        title="Decrease font size"
        onClick={decrease}
      >
        <Minus size={16} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={(event) =>
          handleInputChange(
            event.target.value,
          )
        }
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Font size"
      />

      <button
        type="button"
        title="Increase font size"
        onClick={increase}
      >
        <Plus size={16} />
      </button>

      <button
        type="button"
        className={
            bold
            ? 'active'
            : ''
        }
        title="Bold"
        onClick={onToggleBold}
        >
        <strong>B</strong>
        </button>

        <button
        type="button"
        className={
            italic
            ? 'active'
            : ''
        }
        title="Italic"
        onClick={onToggleItalic}
        >
        <em>I</em>
        </button>

        <button
        type="button"
        className={
            underline
            ? 'active'
            : ''
        }
        title="Underline"
        onClick={
            onToggleUnderline
        }
        >
        <u>U</u>
        </button>
    </div>
  )
}