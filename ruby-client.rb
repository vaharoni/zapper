#!/usr/bin/env ruby

########################
clients_num = 5
strength_range = [5, 20]
duration_range = [100, 1000]
########################

if ARGV.length != 2
  puts "Usage: ./ruby-client.rb hostname port"
  abort
end

require 'active_support/core_ext'
require 'rubygems'
require 'bundler/setup'
require 'httparty'
require 'serialport'


port_str = `ls /dev/tty.usb*`.split("\n").first
baud_rate = 9600  
data_bits = 8  
stop_bits = 1  
parity = SerialPort::NONE  

begin
  sp = SerialPort.new(port_str, baud_rate, data_bits, stop_bits, parity)
  puts "*"*50, "Arduino connected on #{port_str}", "*"*50, nil
rescue
  puts "*"*50, "ARDUINO IS NOT CONNECTED. Suggest to abort", "*"*50, nil
end

def map_range(value, min_value, max_value, min_range, max_range)
  return nil if !value or value.to_f > max_value or value.to_f < min_value
  ((value.to_f - min_value) / (max_value - min_value) * (max_range - min_range) + min_range).to_i
end
    
hostname, port = *ARGV
hostname = hostname.chomp("/")
url = "http://#{hostname}:#{port}/server"

threads = []
(0..clients_num-1).each do |client_id|
  threads << Thread.new do 
    loop do
      begin
        last_connection_time = Time.now
        res = HTTParty.post(url, timeout: 100, body: {client: "processing", clientId: client_id})        
      rescue EOFError
        puts "Client Id #{client_id}: EOFError encountered after #{Time.now - last_connection_time} seconds. Reconnecting"
        next
      rescue Timeout::Error
        puts "Client Id #{client_id}: Client timeout error after #{Time.now - last_connection_time} seconds. " +
              "Server did not issue logical timeout message. Reconnecting"
        next        
      rescue Errno::ECONNREFUSED
        puts "Client Id #{client_id}: Connection refused. Trying again"
        sleep(2)
        next
      end
      # puts "Client id #{client_id} received #{res}"
      
      res_arr = res.try(:split, "$") || []      
      if res_arr[1] != "timeout"
        strength = map_range(res_arr[1].to_i, 1, 5, *strength_range)
        duration = map_range(res_arr[2].to_i, 1, 5, *duration_range)
        
        puts "#{Time.now} Zap strength=#{strength} duration=#{duration}"
        
        if sp
          sp.putc strength % 256
          sp.putc strength / 256
          sp.putc duration % 256
          sp.putc duration / 256
        end
      end
    end
  end
end

threads.each(&:join)