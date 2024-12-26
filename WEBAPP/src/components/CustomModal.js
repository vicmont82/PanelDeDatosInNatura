import React from 'react';
import Modal from 'react-modal';
import { Button } from '@mui/material';


Modal.setAppElement('#root');

const CustomModal = ({ isOpen, onRequestClose, title, children }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel={title}
            style={{
                content: {
                    width: '400px',
                    height: '400px', 
                    maxHeight: '80vh',
                    margin: 'auto',
                    overflow: 'auto' 
                }
            }}
        >
            <h2>{title}</h2>
            {children}
            <Button onClick={onRequestClose}>Cerrar</Button>
        </Modal>
    );
};

export default CustomModal;
