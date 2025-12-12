import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import '../styles/components/Components.css';
// We'll create the CSS file next, or use inline/module, but plan said components dir.
// Actually plan said src/styles/components.

const FileUploader = ({ label, onFileSelect, fileName }) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="file-uploader glass-panel" onClick={handleClick}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
            />
            <div className="uploader-content">
                {fileName ? (
                    <>
                        <CheckCircle className="icon-success" size={48} />
                        <span className="file-name">{fileName}</span>
                        <span className="upload-hint">Click to change</span>
                    </>
                ) : (
                    <>
                        <Upload className="icon-upload" size={48} />
                        <span className="upload-label">{label}</span>
                        <span className="upload-hint">Supports .xlsx, .csv</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
