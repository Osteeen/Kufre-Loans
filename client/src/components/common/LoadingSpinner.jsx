import React from 'react'

export default function LoadingSpinner({ text = '', size = 'md', fullPage = false }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size] || sizes.md} rounded-full border-primary-200 border-t-primary-900 animate-spin`}
        style={{ borderWidth: size === 'sm' ? 2 : size === 'lg' ? 4 : 3 }}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  )
}
