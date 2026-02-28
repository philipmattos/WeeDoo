import React from 'react';
import { NotesModal } from './NotesModal';
import { TasksModal } from './TasksModal';
import { GroceriesModal } from './GroceriesModal';
import { KanbanModal } from './KanbanModal';
import { CalendarModal } from './CalendarModal';

// O ModalManager é o único arquivo responsável por renderizar todos os modais da aplicação
export const ModalManager = () => {
    return (
        <>
            <TasksModal />
            <GroceriesModal />
            <KanbanModal />
            <NotesModal />
            <CalendarModal />
        </>
    );
};
