Import-Module ImportExcel
$data = Import-Excel -Path 'C:\Users\Admin\Desktop\New Microsoft Excel Worksheet (3).xlsx'
$data | Format-Table -AutoSize -Wrap
