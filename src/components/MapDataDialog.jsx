import React, { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chart from 'chart.js/auto';

const MapDataDialog = ({ open, onClose, data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [dialogReady, setDialogReady] = useState(false);

  

  // Dialog開啟時的處理
  useEffect(() => {
    if (open) {
      setDialogReady(false);
    }
  }, [open]);

  // 監控Dialog的TransitionEnd事件
  const handleTransitionEnd = () => {
    if (open) {
      setDialogReady(true);
    }
  };

  // 清理圖表實例
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  // 初始化圖表
  useEffect(() => {
    const initChart = () => {
      if (!open || !data?.chartConfig || !dialogReady || !chartRef.current) {
        return;
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: data.chartConfig,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    };

    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [open, data, dialogReady]);

  if (!data) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      TransitionProps={{
        onEntered: handleTransitionEnd
      }}
    >
      <DialogTitle>
        {data.title}
        <div style={{ float: 'right', fontSize: '0.8em' }}>單位：金額(千元)</div>
      </DialogTitle>
      <DialogContent>
        <div style={{ height: '300px', marginBottom: '1rem', position: 'relative' }}>
          <canvas 
            ref={chartRef}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>年度</TableCell>
                <TableCell>納稅單位</TableCell>
                <TableCell>綜合所得總額</TableCell>
                <TableCell>平均數</TableCell>
                <TableCell>中位數</TableCell>
                <TableCell>第一分位數</TableCell>
                <TableCell>第三分位數</TableCell>
                <TableCell>標準差</TableCell>
                <TableCell>變異係數</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.tableData.map((row, index) => (
                <TableRow key={index}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapDataDialog;
